import crypto from "crypto";
import { config } from "../config.js";

// Mã hóa giống thư viện mẫu của VNPay: encodeURIComponent, khoảng trắng -> "+"
const encode = (value) => encodeURIComponent(String(value)).replace(/%20/g, "+");

const signData = (params) =>
  Object.keys(params)
    .sort()
    .map((key) => `${encode(key)}=${encode(params[key])}`)
    .join("&");

const hmac = (data) => crypto.createHmac("sha512", config.vnpay.hashSecret).update(Buffer.from(data, "utf-8")).digest("hex");

const vnDate = (date) => {
  // VNPay yêu cầu giờ Việt Nam (GMT+7), định dạng yyyyMMddHHmmss
  const d = new Date(date.getTime() + 7 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
};

export function createPaymentUrl({ txnRef, amount, ipAddr, orderInfo }) {
  const now = new Date();
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.vnpay.tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: Math.round(amount) * 100,
    vnp_ReturnUrl: `${config.serverUrl}/api/payments/vnpay-return`,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: vnDate(now),
    vnp_ExpireDate: vnDate(new Date(now.getTime() + 15 * 60 * 1000)),
  };
  const query = signData(params);
  return `${config.vnpay.url}?${query}&vnp_SecureHash=${hmac(query)}`;
}

export function verifyReturn(query) {
  const params = { ...query };
  const secureHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  return secureHash && hmac(signData(params)) === secureHash.toLowerCase();
}
