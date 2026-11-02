import { Router } from "express";
import { auth, asyncHandler, HttpError } from "../middleware/auth.js";
import { isPhone } from "../utils/validate.js";

// Sổ địa chỉ: thao tác trên mảng addresses nhúng trong USER
const router = Router();
router.use(auth);

const list = (user) => [...user.addresses].sort((a, b) => b.isDefault - a.isDefault);

router.get("/", (req, res) => res.json(list(req.user)));

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { recipientName, phone, street, city, isDefault } = req.body;
    if (!recipientName?.trim() || !phone?.trim() || !street?.trim() || !city?.trim()) throw new HttpError(400, "Vui lòng nhập đủ thông tin địa chỉ");
    if (!isPhone(phone)) throw new HttpError(400, "Số điện thoại người nhận không hợp lệ");
    const makeDefault = Boolean(isDefault) || req.user.addresses.length === 0;
    if (makeDefault) req.user.addresses.forEach((a) => (a.isDefault = false));
    req.user.addresses.push({ recipientName, phone, street, city, isDefault: makeDefault });
    await req.user.save();
    res.status(201).json(list(req.user));
  })
);

router.patch(
  "/:id/default",
  asyncHandler(async (req, res) => {
    const address = req.user.addresses.id(req.params.id);
    if (!address) throw new HttpError(404, "Không tìm thấy địa chỉ");
    req.user.addresses.forEach((a) => (a.isDefault = a._id.equals(address._id)));
    await req.user.save();
    res.json(list(req.user));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const address = req.user.addresses.id(req.params.id);
    if (!address) throw new HttpError(404, "Không tìm thấy địa chỉ");
    address.deleteOne();
    if (address.isDefault && req.user.addresses.length) req.user.addresses[0].isDefault = true;
    await req.user.save();
    res.json(list(req.user));
  })
);

export default router;
