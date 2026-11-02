import mongoose from "mongoose";

// ORDER (mỗi đơn thuộc 1 shop), ORDER_ITEM nhúng trong ORDER
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  image: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
});

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    orderDate: { type: Date, default: Date.now },
    totalAmount: { type: Number, required: true, min: 0 },
    // Pending = chờ xác nhận (bổ sung so với ERD)
    orderStatus: { type: String, enum: ["Pending", "Shipping", "Delivered", "Canceled"], default: "Pending" },
    shippingAddress: {
      recipientName: String,
      phone: String,
      street: String,
      city: String,
    },
    items: [orderItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
