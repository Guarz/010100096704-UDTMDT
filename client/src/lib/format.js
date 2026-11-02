export const money = (value) => new Intl.NumberFormat("vi-VN").format(value || 0) + "₫";

export const discount = (p) => (p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);

const PLACEHOLDER = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=60";
export const thumb = (p) => (p.images?.find((i) => i.isThumbnail) || p.images?.[0])?.imageUrl || PLACEHOLDER;

export const specText = (s) => `${s.attributeName} ${s.attributeValue}`;

export const productCode = (p) => `NOVA-${String(p._id).slice(-6).toUpperCase()}`;

export const date = (value) => (value ? new Intl.DateTimeFormat("vi-VN").format(new Date(value)) : "");

export const shortMoney = (value) => {
  if (value >= 1e9) return `${(value / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu`;
  return money(value);
};

export const ORDER_STATUS = {
  Pending: "Chờ xác nhận",
  Shipping: "Đang giao",
  Delivered: "Đã giao",
  Canceled: "Đã hủy",
};

export const PAYMENT_STATUS = {
  Pending: "Chưa thanh toán",
  Paid: "Đã thanh toán",
  Failed: "Thanh toán thất bại",
  Refunded: "Đã hoàn tiền",
};

export const APPROVAL = {
  Pending: ["Chờ duyệt", "pending"],
  Approved: ["Đang bán", "approved"],
  Rejected: ["Từ chối", "rejected"],
};

export const ROLE = { Buyer: "Khách hàng", Seller: "Người bán", Admin: "Quản trị viên" };

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "N";
