import { Router } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Product from "../models/Product.js";
import { auth, asyncHandler, HttpError } from "../middleware/auth.js";
import { missingBuyerInfo } from "../utils/validate.js";
import { cancelOrder, newOrderCode, ordersWithPayment, startVnpay } from "../utils/orders.js";

const router = Router();
router.use(auth);

const thumbnail = (product) => (product.images.find((i) => i.isThumbnail) || product.images[0])?.imageUrl || "";

// Đặt hàng từ giỏ: tách theo shop -> mỗi shop 1 ORDER + 1 PAYMENT
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { addressId, paymentMethod } = req.body;
    const missing = missingBuyerInfo(req.user);
    if (missing.length) throw new HttpError(400, `Vui lòng cập nhật ${missing.join(", ")} trước khi đặt hàng`);
    if (!["COD", "VNPay"].includes(paymentMethod)) throw new HttpError(400, "Phương thức thanh toán không hợp lệ");
    if (!mongoose.isValidObjectId(addressId)) throw new HttpError(400, "Vui lòng chọn địa chỉ nhận hàng");
    const address = req.user.addresses.id(addressId);
    if (!address) throw new HttpError(400, "Vui lòng chọn địa chỉ nhận hàng");

    const cart = await Cart.findOne({ buyer: req.user._id }).populate("items.product");
    const items = (cart?.items || []).filter((i) => i.product && i.product.approvalStatus === "Approved");
    if (!items.length) throw new HttpError(400, "Giỏ hàng đang trống");

    // Giữ hàng: trừ tồn kho có điều kiện, lỗi thì hoàn lại phần đã trừ
    const reserved = [];
    for (const { product, quantity } of items) {
      const ok = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity, sold: quantity } }
      );
      if (!ok) {
        await Promise.all(reserved.map((r) => Product.updateOne({ _id: r.id }, { $inc: { stock: r.quantity, sold: -r.quantity } })));
        throw new HttpError(400, `“${product.productName}” không đủ hàng (còn ${product.stock})`);
      }
      reserved.push({ id: product._id, quantity });
    }

    const byShop = new Map();
    items.forEach((i) => {
      const key = String(i.product.shop);
      byShop.set(key, [...(byShop.get(key) || []), i]);
    });

    const shippingAddress = { recipientName: address.recipientName, phone: address.phone, street: address.street, city: address.city };
    const orders = [];
    const payments = [];
    for (const [shopId, shopItems] of byShop) {
      const orderItems = shopItems.map(({ product, quantity }) => ({
        product: product._id,
        productName: product.productName,
        image: thumbnail(product),
        quantity,
        unitPrice: product.price,
      }));
      const totalAmount = orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      const order = await Order.create({ code: newOrderCode(), buyer: req.user._id, shop: shopId, totalAmount, shippingAddress, items: orderItems });
      orders.push(order);
      payments.push(await Payment.create({ order: order._id, paymentMethod, amount: totalAmount }));
    }

    cart.items = [];
    await cart.save();

    const paymentUrl = paymentMethod === "VNPay" ? await startVnpay(payments, req.ip) : null;
    res.status(201).json({ orders, paymentUrl });
  })
);

router.get("/my", asyncHandler(async (req, res) => res.json(await ordersWithPayment({ buyer: req.user._id }))));

router.patch(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!order) throw new HttpError(404, "Không tìm thấy đơn hàng");
    if (order.orderStatus !== "Pending") throw new HttpError(400, "Chỉ có thể hủy đơn đang chờ xác nhận");
    await cancelOrder(order);
    res.json({ message: "Đã hủy đơn hàng" });
  })
);

// Thanh toán lại đơn VNPay chưa thanh toán
router.post(
  "/:id/pay",
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!order || order.orderStatus === "Canceled") throw new HttpError(404, "Không tìm thấy đơn hàng");
    const payment = await Payment.findOne({ order: order._id });
    if (payment.paymentMethod !== "VNPay" || payment.paymentStatus === "Paid") throw new HttpError(400, "Đơn hàng không cần thanh toán lại");
    res.json({ paymentUrl: await startVnpay([payment], req.ip) });
  })
);

export default router;
