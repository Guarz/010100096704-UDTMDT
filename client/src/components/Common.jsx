import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";

export function FilterGroup({ title, children }) {
  return <div className="filter-group"><b>{title}</b>{children}</div>;
}

export function EmptyState({ title = "Không tìm thấy sản phẩm phù hợp", text = "Hãy thử thay đổi từ khóa hoặc điều kiện lọc." }) {
  return <div className="empty"><span><Icon name="search" size={32} /></span><h2>{title}</h2><p>{text}</p></div>;
}

export function Loading({ text = "Đang tải dữ liệu..." }) {
  return <div className="loading"><span className="spinner" />{text}</div>;
}

export function Breadcrumb({ items }) {
  return (
    <div className="breadcrumb">
      <Link to="/">Trang chủ</Link>
      {items.map((item, i) => (
        <span key={i} className="crumb">
          <span>/</span>
          {item.to ? <Link to={item.to}>{item.label}</Link> : <b>{item.label}</b>}
        </span>
      ))}
    </div>
  );
}
