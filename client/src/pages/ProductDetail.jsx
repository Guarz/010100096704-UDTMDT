import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { Breadcrumb, EmptyState, Loading } from "../components/Common.jsx";
import { api } from "../lib/api.js";
import { useApi } from "../lib/hooks.js";
import { date, discount, money, productCode, specText, thumb } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

function Reviews({ product, onRated }) {
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const { data, reload } = useApi(`/products/${product._id}/reviews`);
  const [comment, setComment] = useState("");
  const [stars, setStars] = useState(5);
  const total = data?.reviews.length || 0;

  const submit = async (event) => {
    event.preventDefault();
    if (!user) return navigate("/account", { state: { from: `/product/${product._id}` } });
    if (!comment.trim()) return notify("Vui lòng nhập nhận xét", "error");
    try {
      const result = await api(`/products/${product._id}/reviews`, { method: "POST", body: { rating: stars, comment } });
      setComment("");
      notify("Cảm ơn bạn đã đánh giá sản phẩm");
      reload();
      onRated(result);
    } catch (err) {
      notify(err.message, "error");
    }
  };

  return (
    <section className="review-section">
      <div className="review-summary">
        <span>Đánh giá sản phẩm</span>
        <div><strong>{product.rating || "–"}</strong><p><b>{"★".repeat(Math.round(product.rating || 0)).padEnd(5, "☆")}</b><small>Dựa trên {product.reviewCount} lượt đánh giá</small></p></div>
        <div className="rating-bars">
          {(data?.distribution || []).map(({ star, count }) => {
            const percent = total ? Math.round((count / total) * 100) : 0;
            return <p key={star}><span>{star} sao</span><i><em style={{ width: `${percent}%` }} /></i><small>{percent}%</small></p>;
          })}
        </div>
      </div>
      <div className="review-content">
        <div className="review-list">
          <h2>Nhận xét từ người mua</h2>
          {!total && <p className="muted-text">Chưa có đánh giá nào cho sản phẩm này.</p>}
          {data?.reviews.map((item) => {
            const name = item.buyer?.fullName || item.buyer?.username || "Khách hàng";
            return (
              <article key={item._id}>
                <div className="review-avatar">{name.charAt(0)}</div>
                <div><b>{name}<span>Đã mua tại NOVA</span></b><p className="review-stars">{"★".repeat(item.rating)}</p><p>{item.comment}</p><small>{date(item.createdAt)}</small></div>
              </article>
            );
          })}
        </div>
        <form className="review-form" onSubmit={submit}>
          <b>Viết đánh giá của bạn</b>
          <p>Chia sẻ trải nghiệm để giúp khách hàng khác lựa chọn tốt hơn. Chỉ khách đã nhận hàng mới có thể đánh giá.</p>
          <label>Mức đánh giá <span className="star-picker">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setStars(n)} aria-label={`${n} sao`}>{n <= stars ? "★" : "☆"}</button>)}</span></label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Nhập nhận xét về sản phẩm..." />
          <button className="primary-button" type="submit">{user ? "Gửi đánh giá" : "Đăng nhập để đánh giá"}</button>
        </form>
      </div>
    </section>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { data, error, loading } = useApi(`/products/${id}`);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState("");

  useEffect(() => {
    if (!data) return;
    setProduct(data.product);
    setImage(thumb(data.product));
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [data]);

  if (error) return <main className="shell cart-page"><Breadcrumb items={[{ label: "Sản phẩm" }]} /><EmptyState title="Không tìm thấy sản phẩm" text="Sản phẩm có thể đã ngừng kinh doanh hoặc đang chờ duyệt." /></main>;
  if (loading || !product) return <main className="shell cart-page"><Loading /></main>;

  const inStock = product.stock > 0;
  const specs = product.specifications;
  const buyNow = async () => (await add(product, quantity)) && navigate("/cart");

  return (
    <main className="product-page">
      <div className="shell">
        <Breadcrumb items={[{ label: product.category.categoryName, to: `/category/${product.category._id}` }, { label: product.productName }]} />
        <div className="product-detail">
          <div className="gallery">
            <div className="main-photo"><img src={image} alt={product.productName} />{discount(product) > 0 && <span>-{discount(product)}%</span>}</div>
            <div className="thumbs">{product.images.map((item, index) => <button className={image === item.imageUrl ? "selected" : ""} key={item._id} onClick={() => setImage(item.imageUrl)}><img src={item.imageUrl} alt={`Ảnh ${index + 1} của ${product.productName}`} /></button>)}</div>
          </div>
          <div className="detail-info">
            <span className="modal-brand">{product.brand} · Mã sản phẩm {productCode(product)}</span>
            <h1>{product.productName}</h1>
            <div className="detail-meta">
              <div className="rating"><span><Icon name="star" size={14} fill="currentColor" /></span><b>{product.rating || "Mới"}</b><small>{product.reviewCount} đánh giá</small></div>
              <p className={inStock ? "stock" : "out"}><span className="status-dot" />{inStock ? `Còn hàng (${product.stock})` : "Tạm hết hàng"}</p>
              <p className="shop-name"><Icon name="box" size={14} /> {product.shop.shopName}</p>
            </div>
            <div className="detail-price"><b>{money(product.price)}</b>{product.oldPrice > product.price && <><del>{money(product.oldPrice)}</del><span>Tiết kiệm {money(product.oldPrice - product.price)}</span></>}</div>
            <div className="offer-box"><b>Ưu đãi dành cho bạn</b><p><Icon name="check" size={15} /> Thanh toán trực tuyến an toàn qua VNPay</p><p><Icon name="check" size={15} /> Miễn phí giao hàng toàn quốc</p></div>
            {specs.length > 0 && <div className="spec-preview"><b>Thông số nổi bật</b>{specs.slice(0, 3).map((spec) => <span key={spec._id}><Icon name="check" size={14} />{specText(spec)}</span>)}</div>}
            <div className="purchase-row">
              <div className="quantity"><button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Giảm số lượng"><Icon name="minus" size={16} /></button><b>{quantity}</b><button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} aria-label="Tăng số lượng"><Icon name="plus" size={16} /></button></div>
              <button className="outline-button" disabled={!inStock} onClick={() => add(product, quantity)}><Icon name="cart" size={18} /> Thêm vào giỏ</button>
              <button className="primary-button buy" disabled={!inStock} onClick={buyNow}>Mua ngay</button>
            </div>
            <div className="service-grid">
              <span><Icon name="truck" /><b>Giao hàng nhanh</b><small>Dự kiến trong 2 giờ</small></span>
              <span><Icon name="check" /><b>Bảo hành chính hãng</b><small>Đầy đủ theo nhà sản xuất</small></span>
              <span><Icon name="box" /><b>Đổi trả 30 ngày</b><small>Thủ tục đơn giản</small></span>
            </div>
          </div>
        </div>
        <section className="description-block">
          <div><span>Mô tả sản phẩm</span><h2>Trải nghiệm công nghệ đáng tin cậy</h2><p>{product.description || `${product.productName} thuộc danh mục ${product.category.categoryName.toLowerCase()} tại NOVA.`}</p></div>
          <div><span>Thông số kỹ thuật</span>{specs.map((spec) => <p key={spec._id}><b>{spec.attributeName}</b><em>{spec.attributeValue}</em></p>)}</div>
        </section>
        <section className="specification-section">
          <div className="section-heading"><div><span>Thông tin sản phẩm</span><h2>Thông số kỹ thuật chi tiết</h2></div></div>
          <div className="spec-table">
            {[["Thương hiệu", product.brand || "—"], ["Danh mục", product.category.categoryName], ["Cửa hàng", product.shop.shopName], ["Mã sản phẩm", productCode(product)], ...specs.map((s) => [s.attributeName, s.attributeValue]), ["Bảo hành", "Chính hãng 12 tháng"]].map(([label, value], i) => <div key={i}><b>{label}</b><span>{value}</span></div>)}
          </div>
        </section>
        <Reviews product={product} onRated={(r) => setProduct((p) => ({ ...p, ...r }))} />
        {data.related.length > 0 && <section className="related-section"><div className="section-heading"><div><span>Có thể bạn quan tâm</span><h2>Sản phẩm liên quan</h2></div></div><div className="product-grid">{data.related.map((p) => <ProductCard key={p._id} product={p} />)}</div></section>}
      </div>
    </main>
  );
}
