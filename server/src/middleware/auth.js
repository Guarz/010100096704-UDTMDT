import jwt from "jsonwebtoken";
import { config } from "../config.js";
import User from "../models/User.js";

export const signToken = (user) => jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: "7d" });

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Bọc async handler để lỗi được chuyển tới error middleware
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Vui lòng đăng nhập");
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, "Phiên đăng nhập đã hết hạn");
  }
  const user = await User.findById(payload.id);
  if (!user) throw new HttpError(401, "Tài khoản không tồn tại");
  if (user.status === "Locked") throw new HttpError(403, "Tài khoản đã bị khóa");
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role) ? next() : next(new HttpError(403, "Bạn không có quyền thực hiện thao tác này"));
