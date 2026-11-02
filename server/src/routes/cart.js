import { Router } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { auth, asyncHandler, HttpError } from "../middleware/auth.js";

const router = Router();
router.use(auth);

const getCart = async (userId) => (await Cart.findOne({ buyer: userId })) || Cart.create({ buyer: userId, items: [] });

// Trả về giỏ hàng kèm thông tin sản phẩm, bỏ các sản phẩm đã bị xóa/ẩn
const view = async (cart) => {
  await cart.populate({ path: "items.product", populate: { path: "shop", select: "shopName" } });
  return {
    items: cart.items
      .filter((i) => i.product && i.product.approvalStatus === "Approved")
      .map((i) => ({ product: i.product, quantity: i.quantity })),
  };
};

async function addItem(cart, productId, quantity) {
  if (!mongoose.isValidObjectId(productId)) throw new HttpError(400, "Sản phẩm không hợp lệ");
  const product = await Product.findOne({ _id: productId, approvalStatus: "Approved" });
  if (!product) throw new HttpError(404, "Sản phẩm không tồn tại");
  const item = cart.items.find((i) => String(i.product) === String(productId));
  const next = (item?.quantity || 0) + quantity;
  if (next > product.stock) throw new HttpError(400, `Chỉ còn ${product.stock} sản phẩm trong kho`);
  if (item) item.quantity = next;
  else cart.items.push({ product: productId, quantity });
}

router.get("/", asyncHandler(async (req, res) => res.json(await view(await getCart(req.user._id)))));

router.post(
  "/items",
  asyncHandler(async (req, res) => {
    const quantity = Math.max(1, Number(req.body.quantity) || 1);
    const cart = await getCart(req.user._id);
    await addItem(cart, req.body.productId, quantity);
    await cart.save();
    res.json(await view(cart));
  })
);

// Gộp giỏ hàng tạm (khách chưa đăng nhập) vào giỏ của tài khoản
router.post(
  "/merge",
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user._id);
    for (const { productId, quantity } of req.body.items || []) {
      try {
        await addItem(cart, productId, Math.max(1, Number(quantity) || 1));
      } catch {
        // bỏ qua sản phẩm không hợp lệ hoặc vượt tồn kho
      }
    }
    await cart.save();
    res.json(await view(cart));
  })
);

router.put(
  "/items/:productId",
  asyncHandler(async (req, res) => {
    const quantity = Number(req.body.quantity);
    const cart = await getCart(req.user._id);
    const item = cart.items.find((i) => String(i.product) === req.params.productId);
    if (!item) throw new HttpError(404, "Sản phẩm không có trong giỏ");
    if (quantity < 1) cart.items.pull(item._id);
    else {
      const product = await Product.findById(req.params.productId);
      if (product && quantity > product.stock) throw new HttpError(400, `Chỉ còn ${product.stock} sản phẩm trong kho`);
      item.quantity = quantity;
    }
    await cart.save();
    res.json(await view(cart));
  })
);

router.delete(
  "/items/:productId",
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.user._id);
    cart.items = cart.items.filter((i) => String(i.product) !== req.params.productId);
    await cart.save();
    res.json(await view(cart));
  })
);

export default router;
