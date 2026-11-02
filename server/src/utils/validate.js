export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Số điện thoại Việt Nam: 10 số bắt đầu bằng 0 (hoặc +84), cho phép khoảng trắng / dấu chấm / gạch
export const isPhone = (value = "") => /^(0|\+84)\d{9}$/.test(String(value).replace(/[\s.-]/g, ""));

// Thông tin bắt buộc trước khi đặt hàng
export const missingBuyerInfo = (user) => {
  const missing = [];
  if (!user.fullName?.trim()) missing.push("họ và tên");
  if (!isPhone(user.phone)) missing.push("số điện thoại");
  if (!user.addresses?.length) missing.push("địa chỉ nhận hàng");
  return missing;
};
