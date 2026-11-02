import Icon from "./Icon.jsx";

const BENEFITS = [
  ["truck", "Giao hàng miễn phí", "Cho đơn từ 500.000₫"],
  ["check", "Sản phẩm chính hãng", "Bảo hành đầy đủ"],
  ["box", "Đổi trả trong 30 ngày", "Thủ tục nhanh chóng"],
  ["user", "Hỗ trợ tận tâm", "Phục vụ 24/7"],
];

export default function Footer() {
  return (
    <footer id="lien-he">
      <div className="benefits"><div className="shell">{BENEFITS.map(([icon, title, desc]) => <div key={title}><span><Icon name={icon} /></span><p><b>{title}</b><small>{desc}</small></p></div>)}</div></div>
      <div className="footer-main shell">
        <div className="footer-brand"><div className="logo light"><span>N</span>NOVA</div><p>Hệ thống bán lẻ công nghệ chính hãng, mang đến trải nghiệm mua sắm hiện đại và đáng tin cậy.</p><b>1900 6868</b><small>Thứ Hai – Chủ Nhật, 8:00 – 22:00</small></div>
        <div><b>Hỗ trợ khách hàng</b><span>Trung tâm trợ giúp</span><span>Hướng dẫn mua hàng</span><span>Tra cứu đơn hàng</span><span>Chính sách bảo hành</span></div>
        <div><b>Chính sách mua sắm</b><span>Chính sách đổi trả</span><span>Chính sách vận chuyển</span><span>Chính sách bảo mật</span><span>Phương thức thanh toán</span></div>
        <div><b>Kết nối với NOVA</b><p>Nhận tin ưu đãi và sản phẩm mới nhất.</p><div className="social"><a href="https://www.facebook.com" target="_blank" rel="noreferrer">Facebook</a><a href="https://www.youtube.com" target="_blank" rel="noreferrer">YouTube</a><a href="https://www.tiktok.com" target="_blank" rel="noreferrer">TikTok</a></div><small>Email: hotro@nova.vn</small></div>
      </div>
      <div className="copyright shell">© {new Date().getFullYear()} NOVA. Bản quyền thuộc Công ty Công nghệ NOVA Việt Nam.<span>Thanh toán an toàn · Mua sắm an tâm</span></div>
    </footer>
  );
}
