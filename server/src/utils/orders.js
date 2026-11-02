import crypto from "crypto";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Product from "../models/Product.js";
import { config, vnpayEnabled } from "../config.js";
import { createPaymentUrl } from "./vnpay.js";

export const newOrderCode = () => `NOVA${Date.now().toString().slice(-6)}${crypto.randomInt(10, 99)}`;

// Hoàn lại tồn kho khi hủy đơn
export async function restoreStock(order) {
  await Promise.all(
    order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity, sold: -i.quantity } }))
  );
}

export async function cancelOrder(order) {
  order.orderStatus = "Canceled";
  await order.save();
  await restoreStock(order);
  const payment = await Payment.findOne({ order: order._id });
  if (payment) {
    payment.paymentStatus = payment.paymentStatus === "Paid" ? "Refunded" : "Failed";
    await payment.save();
  }
}

// Tạo mã giao dịch mới cho các payment VNPay và trả về URL thanh toán
export async function startVnpay(payments, ipAddr) {
  const txnRef = `${Date.now()}${crypto.randomInt(100, 999)}`;
  await Payment.updateMany({ _id: { $in: payments.map((p) => p._id) } }, { transactionRef: txnRef, paymentStatus: "Pending" });
  const amount = payments.reduce((sum, p) => sum + p.amount, 0);
  if (!vnpayEnabled()) return `${config.clientUrl}/payment/mock?ref=${txnRef}`;
  return createPaymentUrl({ txnRef, amount, ipAddr, orderInfo: `Thanh toan don hang NOVA ${txnRef}` });
}

// Cập nhật kết quả thanh toán cho mọi payment thuộc 1 mã giao dịch
export async function settlePayment(txnRef, success) {
  const payments = await Payment.find({ transactionRef: txnRef, paymentStatus: "Pending" });
  for (const payment of payments) {
    if (success) {
      payment.paymentStatus = "Paid";
      payment.paidAt = new Date();
      await payment.save();
    } else {
      payment.paymentStatus = "Failed";
      await payment.save();
    }
  }
  return payments.length;
}

export async function ordersWithPayment(filter) {
  const orders = await Order.find(filter).sort({ orderDate: -1 }).populate("shop", "shopName").populate("buyer", "fullName username email").lean();
  const payments = await Payment.find({ order: { $in: orders.map((o) => o._id) } }).lean();
  const byOrder = Object.fromEntries(payments.map((p) => [String(p.order), p]));
  return orders.map((o) => ({ ...o, payment: byOrder[String(o._id)] || null }));
}
