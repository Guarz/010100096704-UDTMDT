import { Router } from "express";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { auth, requireRole, asyncHandler, HttpError } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [categories, counts] = await Promise.all([
      Category.find().sort({ createdAt: 1 }).lean(),
      Product.aggregate([{ $match: { approvalStatus: "Approved" } }, { $group: { _id: "$category", count: { $sum: 1 } } }]),
    ]);
    const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    res.json(categories.map((c) => ({ ...c, productCount: byId[String(c._id)] || 0 })));
  })
);

router.post(
  "/",
  auth,
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    const { categoryName, description = "", icon = "box" } = req.body;
    if (!categoryName?.trim()) throw new HttpError(400, "Vui lòng nhập tên danh mục");
    res.status(201).json(await Category.create({ categoryName, description, icon }));
  })
);

router.put(
  "/:id",
  auth,
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    const { categoryName, description, icon } = req.body;
    const category = await Category.findByIdAndUpdate(req.params.id, { categoryName, description, icon }, { new: true, runValidators: true });
    if (!category) throw new HttpError(404, "Không tìm thấy danh mục");
    res.json(category);
  })
);

router.delete(
  "/:id",
  auth,
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    if (await Product.exists({ category: req.params.id })) throw new HttpError(400, "Danh mục đang có sản phẩm, không thể xóa");
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa danh mục" });
  })
);

export default router;
