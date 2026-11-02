import "dotenv/config";

export const config = {
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  mongoDb: process.env.MONGODB_DB || "TMDT",
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET || "nova-dev-secret",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  serverUrl: process.env.SERVER_URL || "http://localhost:5000",
  vnpay: {
    tmnCode: process.env.VNP_TMN_CODE || "",
    hashSecret: process.env.VNP_HASH_SECRET || "",
    url: process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  },
};

export const vnpayEnabled = () => Boolean(config.vnpay.tmnCode && config.vnpay.hashSecret);
