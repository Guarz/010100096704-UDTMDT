import { Router } from "express";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { auth, requireRole, asyncHandler, HttpError } from "../middleware/auth.js";

const router = Router();
router.use(auth, requireRole("Admin"));

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [users, shops, pendingPartners, pendingProducts, lockedUsers, gmv, pendingOrders] = await Promise.all([
      User.countDocuments(),
      Shop.countDocuments({ status: "Approved" }),
      Shop.countDocuments({ status: "Pending" }),
      Product.countDocuments({ approvalStatus: "Pending" }),
      User.countDocuments({ status: "Locked" }),
      Order.aggregate([{ $match: { orderStatus: { $ne: "Canceled" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      Order.countDocuments({ orderStatus: "Pending" }),
    ]);
    res.json({ users, shops, pendingPartners, pendingProducts, lockedUsers, pendingOrders, totalTransactions: gmv[0]?.total || 0 });
  })
);

router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    res.json(await User.find().sort({ createdAt: -1 }));
  })
);

router.patch(
  "/users/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!["Active", "Locked"].includes(status)) throw new HttpError(400, "Trạng thái không hợp lệ");
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");
    if (user.role === "Admin") throw new HttpError(400, "Không thể khóa tài khoản quản trị");
    user.status = status;
    await user.save();
    res.json(user);
  })
);

// --- Yêu cầu trở thành đối tác (shop đang chờ duyệt) ---
router.get(
  "/partner-requests",
  asyncHandler(async (req, res) => {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json(await Shop.find(filter).sort({ updatedAt: -1 }).populate("seller", "username fullName email phone status"));
  })
);

router.patch(
  "/partner-requests/:id",
  asyncHandler(async (req, res) => {
    const { status, reason = "" } = req.body;
    if (!["Approved", "Rejected"].includes(status)) throw new HttpError(400, "Trạng thái không hợp lệ");
    const shop = await Shop.findById(req.params.id);
    if (!shop) throw new HttpError(404, "Không tìm thấy yêu cầu");
    if (shop.status !== "Pending") throw new HttpError(400, "Yêu cầu này đã được xử lý");
    if (status === "Rejected" && !reason.trim()) throw new HttpError(400, "Vui lòng nhập lý do từ chối");
    const user = await User.findById(shop.seller);
    if (!user) throw new HttpError(404, "Người dùng không tồn tại");

    shop.status = status;
    shop.rejectReason = status === "Rejected" ? reason.trim() : "";
    shop.reviewedAt = new Date();
    await shop.save();
    if (status === "Approved") {
      user.role = "Seller";
      await user.save();
    }
    res.json(shop);
  })
);

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const filter = req.query.status ? { approvalStatus: req.query.status } : {};
    res.json(
      await Product.find(filter)
        .sort({ updatedAt: -1 })
        .populate("shop", "shopName")
        .populate("category", "categoryName")
    );
  })
);

router.patch(
  "/products/:id/approval",
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!["Approved", "Rejected", "Pending"].includes(status)) throw new HttpError(400, "Trạng thái không hợp lệ");
    const product = await Product.findByIdAndUpdate(req.params.id, { approvalStatus: status }, { new: true });
    if (!product) throw new HttpError(404, "Không tìm thấy sản phẩm");
    res.json(product);
  })
);

export default router;
