import { Router } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import { auth, asyncHandler, HttpError } from "../middleware/auth.js";

const router = Router();
const POPULATE = [
  { path: "shop", select: "shopName" },
  { path: "category", select: "categoryName icon" },
];
const SORTS = {
  featured: { rating: -1, reviewCount: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
  bestseller: { sold: -1 },
  // discountRate = price / oldPrice, càng nhỏ giảm càng nhiều
  discount: { discountRate: 1 },
};
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const specLabel = (s) => `${s.attributeName}: ${s.attributeValue}`;
const isId = (id) => mongoose.isValidObjectId(id);

async function buildFilter(query) {
  const filter = { approvalStatus: "Approved" };
  const q = (query.q || "").trim();
  if (q) {
    const re = new RegExp(escapeRe(q), "i");
    const cats = await Category.find({ categoryName: re }).select("_id");
    filter.$or = [
      { productName: re },
      { brand: re },
      { "specifications.attributeValue": re },
      { category: { $in: cats.map((c) => c._id) } },
    ];
  }
  if (query.category && isId(query.category)) filter.category = query.category;
  if (query.shop && isId(query.shop)) filter.shop = query.shop;
  if (query.brands) filter.brand = { $in: String(query.brands).split(",") };
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.inStock === "1") filter.stock = { $gt: 0 };
  if (query.minRating) filter.rating = { $gte: Number(query.minRating) };
  if (query.specs) {
    const specs = String(query.specs).split("|").map((label) => {
      const i = label.indexOf(": ");
      return { attributeName: label.slice(0, i), attributeValue: label.slice(i + 2) };
    });
    filter.specifications = { $elemMatch: { $or: specs } };
  }
  return filter;
}

// GET /api/products?q=&category=&brands=&minPrice=&maxPrice=&inStock=1&minRating=&specs=&sort=&page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = await buildFilter(req.query);
    const limit = Math.min(Number(req.query.limit) || 24, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const sortKey = SORTS[req.query.sort] ? req.query.sort : "featured";
    const pipeline = [
      { $match: filter },
      { $addFields: { discountRate: { $cond: [{ $gt: ["$oldPrice", 0] }, { $divide: ["$price", "$oldPrice"] }, 1] } } },
      { $sort: { ...SORTS[sortKey], _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];
    const [rows, total] = await Promise.all([Product.aggregate(pipeline), Product.countDocuments(filter)]);
    const items = await Product.populate(rows, POPULATE);
    res.json({ items, total, page, limit });
  })
);

// Gợi ý tìm kiếm trên header
router.get(
  "/suggest",
  asyncHandler(async (req, res) => {
    const q = (req.query.q || "").trim();
    if (q.length < 2) return res.json([]);
    const items = await Product.find(await buildFilter({ q })).sort({ sold: -1 }).limit(4).select("productName price images");
    res.json(items);
  })
);

// Thương hiệu và thông số dùng cho bộ lọc của trang danh mục
router.get(
  "/facets",
  asyncHandler(async (req, res) => {
    const filter = { approvalStatus: "Approved" };
    if (req.query.category && isId(req.query.category)) filter.category = req.query.category;
    const products = await Product.find(filter).select("brand specifications").lean();
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
    const specCount = {};
    products.forEach((p) => p.specifications.forEach((s) => (specCount[specLabel(s)] = (specCount[specLabel(s)] || 0) + 1)));
    const specs = Object.entries(specCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label]) => label);
    res.json({ brands, specs, total: products.length });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "Không tìm thấy sản phẩm");
    const product = await Product.findById(req.params.id).populate(POPULATE);
    if (!product || product.approvalStatus !== "Approved") throw new HttpError(404, "Không tìm thấy sản phẩm");
    const related = await Product.find({ category: product.category._id, _id: { $ne: product._id }, approvalStatus: "Approved" })
      .sort({ rating: -1 })
      .limit(4)
      .populate(POPULATE);
    res.json({ product, related });
  })
);

router.get(
  "/:id/reviews",
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "Không tìm thấy sản phẩm");
    const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 }).populate("buyer", "fullName username");
    const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
    res.json({ reviews, distribution });
  })
);

// Chỉ người mua đã nhận hàng (đơn Delivered) mới được đánh giá
router.post(
  "/:id/reviews",
  auth,
  asyncHandler(async (req, res) => {
    const rating = Number(req.body.rating);
    const comment = (req.body.comment || "").trim();
    if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, "Vui lòng chọn số sao từ 1 đến 5");
    if (!comment) throw new HttpError(400, "Vui lòng nhập nhận xét");
    const product = await Product.findById(req.params.id);
    if (!product) throw new HttpError(404, "Không tìm thấy sản phẩm");
    const bought = await Order.exists({ buyer: req.user._id, orderStatus: "Delivered", "items.product": product._id });
    if (!bought) throw new HttpError(403, "Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng thành công");
    if (await Review.exists({ buyer: req.user._id, product: product._id })) throw new HttpError(409, "Bạn đã đánh giá sản phẩm này");

    await Review.create({ buyer: req.user._id, shop: product.shop, product: product._id, rating, comment });
    const [stats] = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    product.rating = Math.round(stats.avg * 10) / 10;
    product.reviewCount = stats.count;
    await product.save();
    res.status(201).json({ rating: product.rating, reviewCount: product.reviewCount });
  })
);

export default router;
