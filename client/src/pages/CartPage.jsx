import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { Breadcrumb } from "../components/Common.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { money, thumb } from "../lib/format.js";

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, count, total, update, remove } = useCart();
  const checkout = () => (user ? navigate("/checkout") : navigate("/account", { state: { from: "/checkout" } }));

  return (
    <main className="shell cart-page">
      <Breadcrumb items={[{ label: "Giỏ hàng" }]} />
      <div className="page-heading"><span>Đơn hàng của bạn</span><h1>Giỏ hàng</h1><p>{items.length ? `Bạn đang có ${count} sản phẩm trong giỏ.` : "Giỏ hàng đang chờ những sản phẩm bạn yêu thích."}</p></div>
      {!items.length ? (
        <div className="cart-empty"><span><Icon name="cart" size={36} /></span><h2>Giỏ hàng của bạn đang trống</h2><p>Khám phá các sản phẩm công nghệ phù hợp và thêm vào giỏ hàng.</p><button className="primary-button" onClick={() => navigate("/")}>Tiếp tục mua sắm <Icon name="arrow" size={17} /></button></div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            <div className="cart-list-head"><span>Sản phẩm</span><span>Đơn giá</span><span>Số lượng</span><span>Thành tiền</span></div>
            {items.map(({ product, quantity }) => (
              <div className="cart-row" key={product._id}>
                <div className="cart-product">
                  <img src={thumb(product)} alt={product.productName} />
                  <span>
                    <Link to={`/product/${product._id}`}><b>{product.productName}</b></Link>
                    <small>{product.shop?.shopName || product.brand} · {product.stock > 0 ? `Còn ${product.stock}` : "Tạm hết hàng"}</small>
                    <button onClick={() => remove(product._id)}><Icon name="trash" size={14} /> Xóa</button>
                  </span>
                </div>
                <b>{money(product.price)}</b>
                <div className="quantity"><button onClick={() => update(product._id, quantity - 1)} aria-label="Giảm số lượng"><Icon name="minus" size={14} /></button><b>{quantity}</b><button onClick={() => update(product._id, quantity + 1)} aria-label="Tăng số lượng"><Icon name="plus" size={14} /></button></div>
                <strong>{money(product.price * quantity)}</strong>
              </div>
            ))}
          </div>
          <aside className="order-summary">
            <h2>Tóm tắt đơn hàng</h2>
            <p><span>Tạm tính</span><b>{money(total)}</b></p>
            <p><span>Phí vận chuyển</span><b className="free">Miễn phí</b></p>
            <p className="total"><span>Tổng cộng</span><b>{money(total)}</b></p>
            <small>Đã bao gồm thuế theo quy định</small>
            <button className="primary-button wide" onClick={checkout}><Icon name="lock" size={17} /> {user ? "Tiến hành thanh toán" : "Đăng nhập để thanh toán"}</button>
            <button className="continue-button" onClick={() => navigate("/")}>Tiếp tục mua sắm</button>
          </aside>
        </div>
      )}
    </main>
  );
}
