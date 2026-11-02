import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";

// Khách chưa đăng nhập: giỏ lưu ở localStorage. Đăng nhập: giỏ lưu trên server (CART / CART_ITEM)
// và giỏ tạm được gộp vào giỏ của tài khoản.
const GUEST_KEY = "nova-cart";
const CartContext = createContext(null);

const readGuest = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const { user, ready } = useAuth();
  const notify = useToast();
  const [items, setItems] = useState(readGuest);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setItems(readGuest());
      return;
    }
    const guest = readGuest();
    const request = guest.length
      ? api("/cart/merge", { method: "POST", body: { items: guest.map((i) => ({ productId: i.product._id, quantity: i.quantity })) } })
      : api("/cart");
    request
      .then((cart) => {
        localStorage.removeItem(GUEST_KEY);
        setItems(cart.items);
      })
      .catch(() => setItems([]));
  }, [user, ready]);

  const saveGuest = (next) => {
    localStorage.setItem(GUEST_KEY, JSON.stringify(next));
    setItems(next);
  };

  const run = async (request, guestUpdate) => {
    try {
      if (user) setItems((await request()).items);
      else saveGuest(guestUpdate(readGuest()));
      return true;
    } catch (err) {
      notify(err.message, "error");
      return false;
    }
  };

  const add = async (product, quantity = 1) => {
    if (user?.role === "Admin") {
      notify("Tài khoản quản trị không thể mua hàng", "error");
      return false;
    }
    const ok = await run(
      () => api("/cart/items", { method: "POST", body: { productId: product._id, quantity } }),
      (cart) => {
        const found = cart.find((i) => i.product._id === product._id);
        const next = (found?.quantity || 0) + quantity;
        if (next > product.stock) throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
        return found ? cart.map((i) => (i.product._id === product._id ? { ...i, quantity: next } : i)) : [...cart, { product, quantity }];
      }
    );
    if (ok) notify(`Đã thêm “${product.productName}” vào giỏ hàng`);
    return ok;
  };

  const update = (productId, quantity) =>
    run(
      () => api(`/cart/items/${productId}`, { method: "PUT", body: { quantity } }),
      (cart) => {
        const item = cart.find((i) => i.product._id === productId);
        if (item && quantity > item.product.stock) throw new Error(`Chỉ còn ${item.product.stock} sản phẩm trong kho`);
        return quantity < 1 ? cart.filter((i) => i.product._id !== productId) : cart.map((i) => (i.product._id === productId ? { ...i, quantity } : i));
      }
    );

  const remove = (productId) =>
    run(
      () => api(`/cart/items/${productId}`, { method: "DELETE" }),
      (cart) => cart.filter((i) => i.product._id !== productId)
    );

  const reload = useCallback(async () => {
    if (user) setItems((await api("/cart")).items);
  }, [user]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return <CartContext.Provider value={{ items, count, total, add, update, remove, reload }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
