import express from "express";
import cors from "cors";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import addressRoutes from "./routes/addresses.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import sellerRoutes from "./routes/seller.js";
import adminRoutes from "./routes/admin.js";
import partnerRoutes from "./routes/partner.js";

const app = express();
app.set("trust proxy", true);
app.use(cors({ origin: config.clientUrl }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/partner", partnerRoutes);

app.use("/api", (_req, res) => res.status(404).json({ message: "Không tìm thấy API" }));

// Production (Render): phục vụ luôn giao diện React đã build ở client/dist,
// mọi đường dẫn không phải /api trả về index.html để React Router xử lý
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: "7d" }));
  app.use((req, res, next) => (req.method === "GET" && !path.extname(req.path) ? res.sendFile(path.join(clientDist, "index.html")) : next()));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.name === "ValidationError" || err.name === "CastError") return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  if (err.code === 11000) return res.status(409).json({ message: "Dữ liệu đã tồn tại" });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : "Lỗi máy chủ" });
});

connectDb()
  .then(() => app.listen(config.port, () => console.log(`Server running on port ${config.port}${existsSync(clientDist) ? " (kèm giao diện client/dist)" : ""}`)))
  .catch((err) => {
    console.error("Không kết nối được MongoDB:", err.message);
    process.exit(1);
  });
