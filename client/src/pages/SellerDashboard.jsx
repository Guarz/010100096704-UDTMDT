import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import ShopAddressesEditor, { toEditable } from "../components/ShopAddressesEditor.jsx";
import { EmptyState, Loading } from "../components/Common.jsx";
import { api } from "../lib/api.js";
import { useApi, useCategories } from "../lib/hooks.js";
import { APPROVAL, date, initials, money, ORDER_STATUS, PAYMENT_STATUS, shortMoney, thumb } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { statusClass } from "./OrdersPage.jsx";

const TITLES = { overview: "Tổng quan cửa hàng", products: "Quản lý sản phẩm", orders: "Đơn hàng đến shop", shop: "Thông tin cửa hàng" };
const emptyDraft = { productName: "", brand: "", category: "", price: "", oldPrice: "", stock: "", description: "", images: "", specifications: [{ attributeName: "", attributeValue: "" }] };

function Overview({ setTab }) {
  const { data: s } = useApi("/seller/stats");
  if (!s) return <Loading />;
  const stats = [[s.selling, "Sản phẩm đang bán"], [s.pendingOrders, "Đơn chờ xác nhận"], [shortMoney(s.monthRevenue), "Doanh thu tháng"], [s.rating || "–", "Điểm đánh giá"]];
  return (
    <>
      <div className="stat-grid">{stats.map(([number, label]) => <article key={label}><span>{label}</span><b>{number}</b><small>Cập nhật theo thời gian thực</small></article>)}</div>
      <div className="dashboard-card">
        <h2>Việc cần xử lý</h2>
        <div className="task-grid">
          <button onClick={() => setTab("orders")}><b>{String(s.pendingOrders).padStart(2, "0")}</b><span>Đơn chờ xác nhận</span></button>
          <button onClick={() => setTab("products")}><b>{String(s.lowStock).padStart(2, "0")}</b><span>Sản phẩm sắp hết (≤ 5)</span></button>
          <button onClick={() => setTab("products")}><b>{String(s.pendingApproval).padStart(2, "0")}</b><span>Sản phẩm chờ duyệt</span></button>
        </div>
      </div>
    </>
  );
}

function ProductEditor({ initial, onDone }) {
  const notify = useToast();
  const categories = useCategories();
  const [draft, setDraft] = useState(initial);
  const set = (key) => (e) => setDraft({ ...draft, [key]: e.target.value });
  const setSpec = (i, key, value) => setDraft({ ...draft, specifications: draft.specifications.map((s, j) => (j === i ? { ...s, [key]: value } : s)) });

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.productName.trim() || !draft.price || !draft.category) return notify("Vui lòng nhập tên, giá bán và danh mục", "error");
    const body = { ...draft, images: draft.images.split("\n").map((s) => s.trim()).filter(Boolean) };
    try {
      if (draft._id) await api(`/seller/products/${draft._id}`, { method: "PUT", body });
      else await api("/seller/products", { method: "POST", body });
      notify(draft._id ? "Đã cập nhật sản phẩm" : "Đã tạo sản phẩm ở trạng thái chờ duyệt");
      onDone(true);
    } catch (err) {
      notify(err.message, "error");
    }
  };

  return (
    <form className="seller-product-form product-editor" onSubmit={submit}>
      <b>{draft._id ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</b>
      <label className="wide">Tên sản phẩm<input value={draft.productName} onChange={set("productName")} placeholder="Tên sản phẩm" /></label>
      <label>Thương hiệu<input value={draft.brand} onChange={set("brand")} placeholder="Apple, Samsung..." /></label>
      <label>Danh mục<select value={draft.category} onChange={set("category")}><option value="">Chọn danh mục</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.categoryName}</option>)}</select></label>
      <label>Giá bán (₫)<input type="number" min="0" value={draft.price} onChange={set("price")} placeholder="Giá bán" /></label>
      <label>Giá gốc (₫)<input type="number" min="0" value={draft.oldPrice} onChange={set("oldPrice")} placeholder="Để trống nếu không giảm" /></label>
      <label>Tồn kho<input type="number" min="0" value={draft.stock} onChange={set("stock")} placeholder="0" /></label>
      <label className="wide">Mô tả<textarea value={draft.description} onChange={set("description")} placeholder="Mô tả sản phẩm" /></label>
      <label className="wide">Ảnh sản phẩm (mỗi dòng 1 URL, ảnh đầu tiên là ảnh đại diện)<textarea value={draft.images} onChange={set("images")} placeholder="https://..." /></label>
      <div className="wide spec-editor">
        <span>Thông số kỹ thuật</span>
        {draft.specifications.map((s, i) => (
          <div key={i}>
            <input value={s.attributeName} onChange={(e) => setSpec(i, "attributeName", e.target.value)} placeholder="Tên thông số (VD: RAM)" />
            <input value={s.attributeValue} onChange={(e) => setSpec(i, "attributeValue", e.target.value)} placeholder="Giá trị (VD: 16GB)" />
            <button type="button" onClick={() => setDraft({ ...draft, specifications: draft.specifications.filter((_, j) => j !== i) })} aria-label="Xóa thông số"><Icon name="trash" size={14} /></button>
          </div>
        ))}
        <button type="button" className="text-action" onClick={() => setDraft({ ...draft, specifications: [...draft.specifications, { attributeName: "", attributeValue: "" }] })}><Icon name="plus" size={12} /> Thêm thông số</button>
      </div>
      <div className="wide editor-actions">
        <button type="button" className="text-action" onClick={() => onDone(false)}>Hủy</button>
        <button className="primary-button" type="submit">{draft._id ? "Lưu thay đổi" : "Tạo sản phẩm"}</button>
      </div>
      {draft._id && <small className="wide">Lưu ý: thay đổi tên, mô tả, ảnh, danh mục hoặc thông số sẽ cần quản trị viên duyệt lại.</small>}
    </form>
  );
}

function Products() {
  const notify = useToast();
  const { data: products, loading, reload } = useApi("/seller/products");
  const [editing, setEditing] = useState(null);
  const edit = (p) =>
    setEditing({
      _id: p._id,
      productName: p.productName,
      brand: p.brand,
      category: p.category?._id || "",
      price: p.price,
      oldPrice: p.oldPrice ?? "",
      stock: p.stock,
      description: p.description,
      images: p.images.map((i) => i.imageUrl).join("\n"),
      specifications: p.specifications.length ? p.specifications.map(({ attributeName, attributeValue }) => ({ attributeName, attributeValue })) : emptyDraft.specifications,
    });
  const remove = async (p) => {
    if (!window.confirm(`Xóa sản phẩm “${p.productName}”?`)) return;
    try {
      await api(`/seller/products/${p._id}`, { method: "DELETE" });
      notify("Đã xóa sản phẩm khỏi cửa hàng");
      reload();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  return (
    <>
      {editing ? (
        <ProductEditor key={editing._id || "new"} initial={editing} onDone={(changed) => { setEditing(null); if (changed) reload(); }} />
      ) : (
        <div className="toolbar-row"><button className="primary-button" onClick={() => setEditing(emptyDraft)}><Icon name="plus" size={16} /> Thêm sản phẩm mới</button></div>
      )}
      {loading && !products ? <Loading /> : !products?.length ? <EmptyState title="Chưa có sản phẩm" text="Hãy thêm sản phẩm đầu tiên cho cửa hàng của bạn." /> : (
        <div className="management-table">
          <div className="table-head seller-products-head"><span>Sản phẩm</span><span>Danh mục</span><span>Giá bán</span><span>Tồn kho</span><span>Trạng thái</span><span>Thao tác</span></div>
          {products.map((p) => {
            const [label, cls] = APPROVAL[p.approvalStatus];
            return (
              <div className="table-row seller-products-head" key={p._id}>
                <span className="table-product"><img src={thumb(p)} alt="" /><b>{p.productName}</b></span>
                <span>{p.category?.categoryName}</span>
                <b>{money(p.price)}</b>
                <span className={p.stock <= 5 ? "low-stock" : ""}>{p.stock}</span>
                <span className={`status-badge ${cls}`}>{label}</span>
                <span className="table-actions"><button onClick={() => edit(p)}>Sửa</button><button onClick={() => remove(p)}>Xóa</button></span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

const ACTIONS = { Pending: [["Shipping", "Xác nhận & giao"], ["Canceled", "Hủy"]], Shipping: [["Delivered", "Đã giao"]] };

function Orders() {
  const notify = useToast();
  const { data: orders, loading, reload } = useApi("/seller/orders");
  const [filter, setFilter] = useState("All");
  const change = async (order, status) => {
    if (status === "Canceled" && !window.confirm(`Hủy đơn #${order.code}?`)) return;
    try {
      await api(`/seller/orders/${order._id}/status`, { method: "PATCH", body: { status } });
      notify(`Đơn #${order.code}: ${ORDER_STATUS[status]}`);
      reload();
    } catch (err) {
      notify(err.message, "error");
    }
  };
  if (loading && !orders) return <Loading />;
  const visible = (orders || []).filter((o) => filter === "All" || o.orderStatus === filter);
  return (
    <>
      <div className="filter-tabs">{["All", ...Object.keys(ORDER_STATUS)].map((s) => <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>{s === "All" ? "Tất cả" : ORDER_STATUS[s]} ({s === "All" ? orders.length : orders.filter((o) => o.orderStatus === s).length})</button>)}</div>
      {!visible.length ? <EmptyState title="Không có đơn hàng" text="Đơn hàng của khách sẽ xuất hiện tại đây." /> : (
        <div className="management-table">
          <div className="table-head seller-orders-head"><span>Mã đơn</span><span>Khách hàng</span><span>Sản phẩm</span><span>Tổng tiền</span><span>Thanh toán</span><span>Trạng thái</span></div>
          {visible.map((o) => (
            <div className="table-row seller-orders-head" key={o._id}>
              <span><b>#{o.code}</b><small className="cell-sub">{date(o.orderDate)}</small></span>
              <span>{o.shippingAddress?.recipientName || o.buyer?.fullName}<small className="cell-sub">{o.shippingAddress?.phone} · {o.shippingAddress?.city}</small></span>
              <span>{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</span>
              <b>{money(o.totalAmount)}</b>
              <span>{o.payment?.paymentMethod}<small className="cell-sub">{PAYMENT_STATUS[o.payment?.paymentStatus]}</small></span>
              <span className="status-cell">
                <span className={`status-badge ${statusClass(o.orderStatus)}`}>{ORDER_STATUS[o.orderStatus]}</span>
                <span className="table-actions">{(ACTIONS[o.orderStatus] || []).map(([status, label]) => <button key={status} onClick={() => change(o, status)}>{label}</button>)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ShopInfo() {
  const { shop, setShop } = useAuth();
  const notify = useToast();
  const [values, setValues] = useState({ shopName: shop?.shopName || "", description: shop?.description || "", addresses: toEditable(shop?.addresses) });
  const submit = async (e) => {
    e.preventDefault();
    try {
      setShop(await api("/seller/shop", { method: "PUT", body: values }));
      notify("Đã cập nhật thông tin cửa hàng");
    } catch (err) {
      notify(err.message, "error");
    }
  };
  return (
    <form className="seller-product-form product-editor" onSubmit={submit}>
      <b>Thông tin hiển thị với khách hàng</b>
      <label className="wide">Tên cửa hàng<input value={values.shopName} onChange={(e) => setValues({ ...values, shopName: e.target.value })} /></label>
      <label className="wide">Giới thiệu<textarea value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} /></label>
      <ShopAddressesEditor value={values.addresses} onChange={(addresses) => setValues({ ...values, addresses })} />
      <div className="wide editor-actions"><button className="primary-button" type="submit">Lưu thay đổi</button></div>
    </form>
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { shop } = useAuth();
  const [tab, setTab] = useState("overview");
  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <button className="logo light" onClick={() => navigate("/")}><span>N</span>NOVA</button>
        <p>Trung tâm người bán</p>
        <nav>{Object.entries(TITLES).map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{key === "overview" ? "Tổng quan" : label}</button>)}</nav>
        <button className="back-store" onClick={() => navigate("/")}>Quay lại cửa hàng</button>
      </aside>
      <section className="dashboard-content">
        <div className="dashboard-top"><div><span>Kênh người bán</span><h1>{TITLES[tab]}</h1></div><div className="seller-chip"><span>{initials(shop?.shopName)}</span><b>{shop?.shopName}</b></div></div>
        {tab === "overview" && <Overview setTab={setTab} />}
        {tab === "products" && <Products />}
        {tab === "orders" && <Orders />}
        {tab === "shop" && <ShopInfo />}
      </section>
    </main>
  );
}
