import { Router } from "express";
import Shop from "../models/Shop.js";
import { auth, asyncHandler, HttpError } from "../middleware/auth.js";

// "Trở thành đối tác": người mua gửi thông tin cửa hàng, admin duyệt trong routes/admin.js
const router = Router();
router.use(auth);

export function readShopAddresses(addresses) {
  const list = (Array.isArray(addresses) ? addresses : [])
    .filter((a) => a && (a.street?.trim() || a.city?.trim() || a.phone?.trim()))
    .map((a) => ({ label: a.label?.trim() || "", phone: a.phone?.trim() || "", street: a.street?.trim() || "", city: a.city?.trim() || "" }));
  if (!list.length) throw new HttpError(400, "Vui lòng nhập ít nhất 1 địa chỉ cửa hàng");
  if (list.some((a) => !a.phone || !a.street || !a.city)) throw new HttpError(400, "Mỗi địa chỉ cửa hàng cần số điện thoại, địa chỉ và tỉnh/thành");
  return list;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await Shop.findOne({ seller: req.user._id }));
  })
);

// Gửi mới hoặc gửi lại (khi bị từ chối) yêu cầu đối tác
router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (req.user.role !== "Buyer") throw new HttpError(400, "Tài khoản của bạn không thể đăng ký đối tác");
    const shopName = (req.body.shopName || "").trim();
    if (shopName.length < 2) throw new HttpError(400, "Vui lòng nhập tên cửa hàng");
    const data = { shopName, description: (req.body.description || "").trim(), addresses: readShopAddresses(req.body.addresses) };

    let shop = await Shop.findOne({ seller: req.user._id });
    if (shop?.status === "Pending") throw new HttpError(409, "Yêu cầu của bạn đang chờ quản trị viên duyệt");
    if (shop?.status === "Approved") throw new HttpError(409, "Bạn đã là đối tác của NOVA");
    if (shop) Object.assign(shop, data, { status: "Pending", rejectReason: "", reviewedAt: undefined });
    else shop = new Shop({ ...data, seller: req.user._id });
    await shop.save();
    res.status(201).json(shop);
  })
);

export default router;
