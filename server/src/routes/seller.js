import { Router } from "express";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Review from "../models/Review.js";
import Category from "../models/Category.js";
import { auth, requireRole, asyncHandler, HttpError } from "../middleware/auth.js";
import { cancelOrder, ordersWithPayment } from "../utils/orders.js";
import { readShopAddresses } from "./partner.js";

const router = Router();
router.use(auth, requireRole("Seller"));

// Gắn shop của seller hiện tại vào req.shop
router.use(
  asyncHandler(async (req, _res, next) => {
    req.shop = await Shop.findOne({ seller: req.user._id, status: "Approved" });
    if (!req.shop) throw new HttpError(404, "Bạn chưa có cửa hàng được duyệt");
    next();
  })
);

router.get("/shop", (req, res) => res.json(req.shop));

router.put(
  "/shop",
  asyncHandler(async (req, res) => {
    const { shopName, description, addresses } = req.body;
    if (shopName !== undefined) {
      if (!shopName.trim()) throw new HttpError(400, "Tên cửa hàng không được để trống");
      req.shop.shopName = shopName.trim();
    }
    if (description !== undefined) req.shop.description = description;
    if (addresses !== undefined) req.shop.addresses = readShopAddresses(addresses);
    await req.shop.save();
    res.json(req.shop);
  })
);

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const shop = req.shop._id;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [selling, pendingOrders, lowStock, pendingApproval, revenue, rating] = await Promise.all([
      Product.countDocuments({ shop, approvalStatus: "Approved" }),
      Order.countDocuments({ shop, orderStatus: "Pending" }),
      Product.countDocuments({ shop, stock: { $lte: 5 } }),
      Product.countDocuments({ shop, approvalStatus: "Pending" }),
      Order.aggregate([
        { $match: { shop, orderStatus: { $ne: "Canceled" }, orderDate: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Review.aggregate([{ $match: { shop } }, { $group: { _id: null, avg: { $avg: "$rating" } } }]),
    ]);
    res.json({
      selling,
      pendingOrders,
      lowStock,
      pendingApproval,
      monthRevenue: revenue[0]?.total || 0,
      rating: rating[0] ? Math.round(rating[0].avg * 10) / 10 : 0,
    });
  })
);

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    res.json(await Product.find({ shop: req.shop._id }).sort({ createdAt: -1 }).populate("category", "categoryName"));
  })
);

function readProduct(body) {
  const data = {};
  const fields = ["productName", "brand", "description", "category"];
  fields.forEach((f) => body[f] !== undefined && (data[f] = typeof body[f] === "string" ? body[f].trim() : body[f]));
  ["price", "oldPrice", "stock"].forEach((f) => body[f] !== undefined && body[f] !== "" && (data[f] = Number(body[f])));
  if (Array.isArray(body.images)) {
    data.images = body.images.filter(Boolean).map((url, i) => ({ imageUrl: String(url).trim(), isThumbnail: i === 0 }));
  }
  if (Array.isArray(body.specifications)) {
    data.specifications = body.specifications
      .filter((s) => s?.attributeName?.trim() && s?.attributeValue?.trim())
      .map((s) => ({ attributeName: s.attributeName.trim(), attributeValue: s.attributeValue.trim() }));
  }
  if (data.price !== undefined && !(data.price > 0)) throw new HttpError(400, "Giá bán phải lớn hơn 0");
  if (data.stock !== undefined && !(data.stock >= 0)) throw new HttpError(400, "Tồn kho không hợp lệ");
  return data;
}

router.post(
  "/products",
  asyncHandler(async (req, res) => {
    const data = readProduct(req.body);
    if (!data.productName) throw new HttpError(400, "Vui lòng nhập tên sản phẩm");
    if (data.price === undefined) throw new HttpError(400, "Vui lòng nhập giá bán");
    if (!(await Category.exists({ _id: data.category }))) throw new HttpError(400, "Danh mục không hợp lệ");
    const product = await Product.create({ ...data, shop: req.shop._id, approvalStatus: "Pending" });
    res.status(201).json(product);
  })
);

router.put(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, shop: req.shop._id });
    if (!product) throw new HttpError(404, "Không tìm thấy sản phẩm");
    const data = readProduct(req.body);
    // Thay đổi nội dung (không phải giá/tồn kho) cần quản trị viên duyệt lại
    const snapshot = (p) => ({
      productName: p.productName,
      brand: p.brand,
      description: p.description,
      category: String(p.category),
      images: p.images?.map((i) => i.imageUrl),
      specifications: p.specifications?.map((s) => `${s.attributeName}=${s.attributeValue}`),
    });
    const before = snapshot(product);
    const after = snapshot({ ...before, ...data, images: data.images || product.images, specifications: data.specifications || product.specifications, category: data.category || product.category });
    const needsReview = JSON.stringify(before) !== JSON.stringify(after);
    Object.assign(product, data);
    if (needsReview) product.approvalStatus = "Pending";
    await product.save();
    res.json(product);
  })
);

router.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findOneAndDelete({ _id: req.params.id, shop: req.shop._id });
    if (!product) throw new HttpError(404, "Không tìm thấy sản phẩm");
    res.json({ message: "Đã xóa sản phẩm" });
  })
);

router.get("/orders", asyncHandler(async (req, res) => res.json(await ordersWithPayment({ shop: req.shop._id }))));

const NEXT_STATUS = { Pending: ["Shipping", "Canceled"], Shipping: ["Delivered"] };

router.patch(
  "/orders/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, shop: req.shop._id });
    if (!order) throw new HttpError(404, "Không tìm thấy đơn hàng");
    if (!NEXT_STATUS[order.orderStatus]?.includes(status)) throw new HttpError(400, "Không thể chuyển sang trạng thái này");
    const payment = await Payment.findOne({ order: order._id });
    if (status === "Canceled") {
      await cancelOrder(order);
    } else {
      if (status === "Shipping" && payment?.paymentMethod === "VNPay" && payment.paymentStatus !== "Paid") {
        throw new HttpError(400, "Đơn VNPay chưa được thanh toán");
      }
      order.orderStatus = status;
      await order.save();
      // COD: thu tiền khi giao thành công
      if (status === "Delivered" && payment?.paymentMethod === "COD") {
        payment.paymentStatus = "Paid";
        payment.paidAt = new Date();
        await payment.save();
      }
    }
    res.json({ message: "Đã cập nhật trạng thái đơn hàng" });
  })
);

export default router;
