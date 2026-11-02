import mongoose from "mongoose";

// PAYMENT: 1 order - 1 payment. transactionRef gom các payment của cùng 1 lần thanh toán VNPay
const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    paymentMethod: { type: String, enum: ["VNPay", "COD"], required: true },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed", "Refunded"], default: "Pending" },
    amount: { type: Number, required: true },
    transactionRef: { type: String, index: true },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
