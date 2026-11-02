import { Router } from "express";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import { config } from "../config.js";
import { auth, asyncHandler, HttpError } from "../middleware/auth.js";
import { verifyReturn } from "../utils/vnpay.js";
import { settlePayment } from "../utils/orders.js";

const router = Router();

// VNPay chuyển hướng người dùng về đây sau khi thanh toán
router.get(
  "/vnpay-return",
  asyncHandler(async (req, res) => {
    const valid = verifyReturn(req.query);
    const success = valid && req.query.vnp_ResponseCode === "00" && req.query.vnp_TransactionStatus === "00";
    if (valid) await settlePayment(req.query.vnp_TxnRef, success);
    res.redirect(`${config.clientUrl}/orders?payment=${success ? "success" : "failed"}`);
  })
);

// --- Cổng thanh toán mô phỏng (dùng khi chưa cấu hình VNP_TMN_CODE / VNP_HASH_SECRET) ---
async function findTransaction(ref, userId) {
  const payments = await Payment.find({ transactionRef: ref }).lean();
  const orders = await Order.find({ _id: { $in: payments.map((p) => p.order) }, buyer: userId }).lean();
  if (!payments.length || orders.length !== payments.length) throw new HttpError(404, "Không tìm thấy giao dịch");
  return { payments, orders };
}

router.get(
  "/mock/:ref",
  auth,
  asyncHandler(async (req, res) => {
    const { payments, orders } = await findTransaction(req.params.ref, req.user._id);
    res.json({
      ref: req.params.ref,
      amount: payments.reduce((sum, p) => sum + p.amount, 0),
      status: payments.every((p) => p.paymentStatus === "Paid") ? "Paid" : payments[0].paymentStatus,
      orders: orders.map((o) => o.code),
    });
  })
);

router.post(
  "/mock/:ref",
  auth,
  asyncHandler(async (req, res) => {
    await findTransaction(req.params.ref, req.user._id);
    await settlePayment(req.params.ref, Boolean(req.body.success));
    res.json({ status: req.body.success ? "success" : "failed" });
  })
);

export default router;
