import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { useCart } from "../context/CartContext.jsx";
import { discount, money, thumb } from "../lib/format.js";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { add } = useCart();
  const open = () => navigate(`/product/${product._id}`);
  const inStock = product.stock > 0;
  return (
    <article className="product-card">
      <button className="product-image" onClick={open} aria-label={`Xem ${product.productName}`}>
        <img src={thumb(product)} alt={product.productName} />
        {discount(product) > 0 && <span className="discount">-{discount(product)}%</span>}
      </button>
      <div className="product-body">
        <p className="brand">{product.brand || product.shop?.shopName}</p>
        <button className="product-name" onClick={open}>{product.productName}</button>
        <div className="rating"><span><Icon name="star" size={13} fill="currentColor" /></span><b>{product.rating || "Mới"}</b><small>({product.reviewCount})</small></div>
        <div className="prices"><b>{money(product.price)}</b>{product.oldPrice > product.price && <del>{money(product.oldPrice)}</del>}</div>
        <p className={inStock ? "stock" : "out"}><span className="status-dot" />{inStock ? "Còn hàng" : "Tạm hết hàng"}</p>
        <button className="add-button" disabled={!inStock} onClick={() => add(product)}><Icon name="cart" size={17} />{inStock ? "Thêm vào giỏ" : "Tạm hết hàng"}</button>
      </div>
    </article>
  );
}
