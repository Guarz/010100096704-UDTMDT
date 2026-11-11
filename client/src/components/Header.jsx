import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Icon from "./Icon.jsx";
import { api } from "../lib/api.js";
import { money, thumb } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export function goSection(navigate, pathname, id) {
  const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (pathname !== "/") {
    navigate("/");
    window.setTimeout(scroll, 120);
  } else scroll();
}

export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { count } = useCart();
  const [search, setSearch] = useState(pathname === "/search" ? params.get("q") || "" : "");
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(() => api(`/products/suggest?q=${encodeURIComponent(q)}`).then(setSuggestions).catch(() => {}), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const submit = () => {
    setFocused(false);
    navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };
  const showSuggestions = focused && suggestions.length > 0 && pathname !== "/search";

  return (
    <header>
      <div className="top-note">Miễn phí giao hàng toàn quốc cho đơn từ 500.000₫ <span>Hỗ trợ 24/7: 1900 6868</span></div>
      <div className="header-main shell">
        <button className="logo" onClick={() => navigate("/")}><span>N</span>NOVA</button>
        <div className="search-wrap" onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 150)}>
          <form className="search-box" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm điện thoại, laptop, linh kiện..." aria-label="Tìm kiếm sản phẩm" />
            {search && <button type="button" className="clear-mini" onClick={() => setSearch("")} aria-label="Xóa từ khóa"><Icon name="close" size={16} /></button>}
            <button className="search-button" aria-label="Tìm kiếm"><Icon name="search" /></button>
          </form>
          {showSuggestions && (
            <div className="search-suggestions">
              <small>Gợi ý sản phẩm</small>
              {suggestions.map((p) => (
                <button key={p._id} onClick={() => { setFocused(false); navigate(`/product/${p._id}`); }}>
                  <img src={thumb(p)} alt="" /><span><b>{p.productName}</b><em>{money(p.price)}</em></span>
                </button>
              ))}
              <button className="all-results" onClick={submit}>Xem tất cả kết quả <Icon name="arrow" size={14} /></button>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button className="header-action account-action" onClick={() => navigate("/account")} aria-label="Tài khoản">
            <Icon name="user" />
            <span><small>Tài khoản</small><b>{user ? user.fullName || user.username : "Đăng nhập"}</b></span>
          </button>
          <button className="header-action contact-action" onClick={() => goSection(navigate, pathname, "lien-he")} aria-label="Liên hệ"><Icon name="truck" /><span><small>Hỗ trợ</small><b>Liên hệ</b></span></button>
          <button className="cart-button" onClick={() => navigate("/cart")} aria-label={`Giỏ hàng có ${count} sản phẩm`}><Icon name="cart" size={24} />{count > 0 && <span>{count}</span>}</button>
        </div>
      </div>
      <nav className="main-nav">
        <div className="shell nav-inner">
          <button className={pathname === "/" ? "active" : ""} onClick={() => navigate("/")}>Trang chủ</button>
          <button className={pathname.startsWith("/category") ? "active" : ""} onClick={() => navigate("/category")}>Danh mục sản phẩm</button>
          <button onClick={() => goSection(navigate, pathname, "khuyen-mai")}>Khuyến mãi</button>
          <button className={pathname === "/orders" ? "active" : ""} onClick={() => navigate("/orders")}>Đơn hàng</button>
          <button onClick={() => goSection(navigate, pathname, "lien-he")}>Liên hệ</button>
          {user?.role === "Seller" && <button onClick={() => navigate("/seller")}>Kênh người bán</button>}
          {user?.role === "Admin" && <button onClick={() => navigate("/admin")}>Quản trị</button>}
          <span className="nav-promo">Ưu đãi sinh viên đến 10%</span>
        </div>
      </nav>
    </header>
  );
}
