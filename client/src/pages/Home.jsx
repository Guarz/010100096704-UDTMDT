import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { Loading } from "../components/Common.jsx";
import { api } from "../lib/api.js";
import { useCategories } from "../lib/hooks.js";

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;

// Đồng hồ đếm ngược tới hết ngày cho mục "Ưu đãi chớp nhoáng"
function Countdown() {
  const left = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return Math.max(0, Math.floor((end - new Date()) / 1000));
  };
  const [seconds, setSeconds] = useState(left);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(left()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const pad = (n) => String(n).padStart(2, "0");
  return <div className="countdown"><span>Kết thúc sau</span><b>{pad(Math.floor(seconds / 3600))}</b><i>:</i><b>{pad(Math.floor((seconds % 3600) / 60))}</b><i>:</i><b>{pad(seconds % 60)}</b></div>;
}

function ProductRow({ sort }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    api(`/products?sort=${sort}&limit=4`).then((d) => setItems(d.items)).catch(() => setItems([]));
  }, [sort]);
  if (!items) return <Loading />;
  return <div className="product-grid">{items.map((p) => <ProductCard key={p._id} product={p} />)}</div>;
}

export default function Home() {
  const navigate = useNavigate();
  const categories = useCategories();
  const goCategory = (name) => {
    const cat = categories.find((c) => c.categoryName === name) || categories[0];
    if (cat) navigate(`/category/${cat._id}`);
  };
  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <span className="eyebrow">Công nghệ mới · Giá tốt mỗi ngày</span>
          <h1>Nâng cấp công nghệ<br /><em>Bứt phá trải nghiệm</em></h1>
          <p>Khám phá hệ sinh thái công nghệ chính hãng với ưu đãi đặc quyền, giao nhanh và bảo hành tận tâm.</p>
          <button className="primary-button" onClick={() => goCategory("Điện thoại")}>Khám phá ngay <Icon name="arrow" size={18} /></button>
          <div className="hero-metrics"><span><b>100%</b><small>Chính hãng</small></span><span><b>30 ngày</b><small>Đổi trả</small></span><span><b>0%</b><small>Trả góp</small></span></div>
        </div>
        <img src={img("photo-1654555023156-0a1c9cdf1130")} alt="Laptop và điện thoại công nghệ hiện đại" />
        <div className="hero-deal"><span>Ưu đãi trong tuần</span><b>Giảm đến 20%</b><small>Cho laptop và điện thoại cao cấp</small></div>
        <div className="hero-orb one" /><div className="hero-orb two" />
      </section>

      <div className="brand-strip shell">
        <span>Thương hiệu hàng đầu</span>
        {["Apple", "Samsung", "ASUS", "NVIDIA", "Logitech", "Sony"].map((brand) => <b key={brand}>{brand}</b>)}
      </div>

      <section className="section shell">
        <div className="section-heading"><div><span>Danh mục</span><h2>Mua sắm theo nhu cầu</h2></div><button onClick={() => navigate("/search")}>Xem tất cả <Icon name="arrow" size={16} /></button></div>
        <div className="category-grid">{categories.map((cat) => <button className="category-card" key={cat._id} onClick={() => navigate(`/category/${cat._id}`)}><span><Icon name={cat.icon} size={28} /></span><b>{cat.categoryName}</b><small>{cat.productCount} sản phẩm</small></button>)}</div>
      </section>

      <section className="sale-section" id="khuyen-mai">
        <div className="section shell">
          <div className="sale-heading">
            <div><span className="sale-tag">Giá sốc hôm nay</span><h2>Ưu đãi chớp nhoáng</h2><p>Số lượng có hạn, nhanh tay chọn sản phẩm bạn yêu thích.</p></div>
            <Countdown />
          </div>
          <ProductRow sort="discount" />
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading"><div><span>Tuyển chọn cho bạn</span><h2>Sản phẩm nổi bật</h2></div><button onClick={() => navigate("/search?sort=featured")}>Xem tất cả <Icon name="arrow" size={16} /></button></div>
        <ProductRow sort="featured" />
      </section>

      <section className="promo shell">
        <div><span>Góc làm việc thế hệ mới</span><h2>Mạnh mẽ hơn.<br />Chinh phục mọi giới hạn.</h2><p>Hoàn thiện góc máy trong mơ với màn hình, linh kiện và phụ kiện gaming chính hãng.</p><button onClick={() => goCategory("Linh kiện PC")}>Xem bộ sưu tập <Icon name="arrow" size={17} /></button></div>
        <img src={img("photo-1696710257827-75e2e5954059")} alt="Góc máy chơi game hiện đại" />
      </section>

      <section className="section shell">
        <div className="section-heading"><div><span>Được khách hàng yêu thích</span><h2>Sản phẩm bán chạy</h2></div><div className="verified-note"><Icon name="check" size={14} /> Lựa chọn từ hàng nghìn khách hàng</div></div>
        <ProductRow sort="bestseller" />
      </section>
    </>
  );
}
