import { Router } from "express";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import { auth, asyncHandler, HttpError, signToken } from "../middleware/auth.js";
import { EMAIL_RE, isPhone } from "../utils/validate.js";

const router = Router();

const session = async (user) => ({
  token: signToken(user),
  user,
  // Trả về cả shop đang chờ duyệt / bị từ chối để giao diện hiển thị trạng thái yêu cầu đối tác
  shop: await Shop.findOne({ seller: user._id }),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    // Đăng ký chỉ cần username, email, password. Họ tên, SĐT, địa chỉ bổ sung trong hồ sơ (bắt buộc khi đặt hàng).
    // Mọi tài khoản mới là Buyer; muốn bán hàng thì gửi yêu cầu "Trở thành đối tác" (routes/partner.js)
    const { username, email, password } = req.body;
    if (!username || username.trim().length < 3) throw new HttpError(400, "Tên đăng nhập cần ít nhất 3 ký tự");
    if (!EMAIL_RE.test(email || "")) throw new HttpError(400, "Vui lòng nhập đúng địa chỉ email");
    if (!password || password.length < 6) throw new HttpError(400, "Mật khẩu cần có ít nhất 6 ký tự");
    const exists = await User.findOne({ $or: [{ username: username.trim() }, { email: email.toLowerCase() }] });
    if (exists) throw new HttpError(409, "Tên đăng nhập hoặc email đã được sử dụng");

    const user = await User.create({ username: username.trim(), email, password, role: "Buyer" });
    res.status(201).json(await session(user));
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { login = "", password = "" } = req.body;
    const key = login.trim();
    const user = await User.findOne({ $or: [{ email: key.toLowerCase() }, { username: key }] }).select("+password");
    if (!user || !(await user.checkPassword(password))) throw new HttpError(401, "Sai tên đăng nhập hoặc mật khẩu");
    if (user.status === "Locked") throw new HttpError(403, "Tài khoản của bạn đã bị khóa");
    res.json(await session(user));
  })
);

router.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const { user, shop } = await session(req.user);
    res.json({ user, shop });
  })
);

router.put(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const { fullName, phone, email, birthday } = req.body;
    if (email !== undefined) {
      if (!EMAIL_RE.test(email)) throw new HttpError(400, "Vui lòng nhập đúng địa chỉ email");
      const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
      if (taken) throw new HttpError(409, "Email đã được sử dụng");
      req.user.email = email;
    }
    if (fullName !== undefined) req.user.fullName = fullName.trim();
    if (phone !== undefined) {
      if (phone.trim() && !isPhone(phone)) throw new HttpError(400, "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)");
      req.user.phone = phone.trim();
    }
    if (birthday !== undefined) req.user.birthday = birthday || undefined;
    await req.user.save();
    res.json({ user: req.user });
  })
);

router.put(
  "/me/password",
  auth,
  asyncHandler(async (req, res) => {
    const { currentPassword = "", newPassword = "" } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.checkPassword(currentPassword))) throw new HttpError(400, "Mật khẩu hiện tại không đúng");
    if (newPassword.length < 6) throw new HttpError(400, "Mật khẩu mới cần có ít nhất 6 ký tự");
    user.password = newPassword;
    await user.save();
    res.json({ message: "Đã đổi mật khẩu" });
  })
);

export default router;
