import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon, { CATEGORY_ICONS } from "../components/Icon.jsx";
import { EmptyState, Loading } from "../components/Common.jsx";
import { api } from "../lib/api.js";
import { clearCategoryCache, useApi } from "../lib/hooks.js";
import { APPROVAL, date, money, ROLE, shortMoney, thumb } from "../lib/format.js";
import { useToast } from "../context/ToastContext.jsx";

const TITLES = { overview: "Tổng quan hệ thống", partners: "Duyệt đối tác", users: "Quản lý người dùng", moderation: "Kiểm duyệt sản phẩm", categories: "Danh mục sản phẩm" };

function useAction(reload) {
  const notify = useToast();
  return async (path, method, body, message) => {
    try {
      await api(path, { method, body });
      notify(message);
      reload();
    } catch (err) {
      notify(err.message, "error");
    }
  };
}

function Overview({ setTab }) {
  const { data: s } = useApi("/admin/stats");
  if (!s) return <Loading />;
  const stats = [[s.users.toLocaleString("vi-VN"), "Tài khoản người dùng"], [s.shops, "Cửa hàng hoạt động"], [s.pendingProducts, "Sản phẩm chờ duyệt"], [shortMoney(s.totalTransactions), "Tổng giao dịch"]];
  const tasks = [
    ["partners", s.pendingPartners, "Yêu cầu trở thành đối tác"],
    ["moderation", s.pendingProducts, "Sản phẩm cần duyệt"],
    ["users", s.lockedUsers, "Tài khoản đang bị khóa"],
  ];
  return (
    <>
      <div className="stat-grid">{stats.map(([number, label]) => <article key={label}><span>{label}</span><b>{number}</b><small>Dữ liệu từ hệ thống</small></article>)}</div>
      <div className="dashboard-card">
        <h2>Hoạt động cần chú ý</h2>
        <div className="task-grid">{tasks.map(([key, count, label]) => <button key={key} onClick={() => setTab(key)}><b>{String(count).padStart(2, "0")}</b><span>{label}</span></button>)}</div>
      </div>
    </>
  );
}

const PARTNER_TABS = [["Pending", "Chờ duyệt"], ["Approved", "Đã duyệt"], ["Rejected", "Từ chối"], ["", "Tất cả"]];

function Partners() {
  const [status, setStatus] = useState("Pending");
  const { data: requests, loading, reload } = useApi(`/admin/partner-requests${status ? `?status=${status}` : ""}`);
  const act = useAction(reload);
  const review = (shop, value) => {
    if (value === "Approved") return act(`/admin/partner-requests/${shop._id}`, "PATCH", { status: value }, `Đã duyệt “${shop.shopName}”, người dùng trở thành người bán`);
    const reason = window.prompt(`Lý do từ chối “${shop.shopName}”:`);
    if (reason?.trim()) act(`/admin/partner-requests/${shop._id}`, "PATCH", { status: value, reason }, "Đã từ chối yêu cầu");
  };
  return (
    <>
      <div className="filter-tabs">{PARTNER_TABS.map(([value, label]) => <button key={label} className={status === value ? "active" : ""} onClick={() => setStatus(value)}>{label}</button>)}</div>
      {loading && !requests ? <Loading /> : !requests?.length ? <EmptyState title="Không có yêu cầu" text="Không có yêu cầu đối tác nào ở trạng thái này." /> : (
        <div className="partner-grid">
          {requests.map((shop) => {
            const [label, cls] = { Pending: ["Chờ duyệt", "pending"], Approved: ["Đã duyệt", "approved"], Rejected: ["Từ chối", "rejected"] }[shop.status];
            return (
              <article key={shop._id}>
                <header><div><h2>{shop.shopName}</h2><small>Gửi ngày {date(shop.updatedAt)}</small></div><b className={`status-badge ${cls}`}>{label}</b></header>
                <p className="partner-owner"><Icon name="user" size={14} /> {shop.seller?.fullName || shop.seller?.username} · {shop.seller?.email}{shop.seller?.phone ? ` · ${shop.seller.phone}` : ""}</p>
                {shop.description && <p>{shop.description}</p>}
                <ul>{shop.addresses.map((a) => <li key={a._id}><b>{a.label || "Địa chỉ"}</b> {a.street}, {a.city} · {a.phone}</li>)}</ul>
                {shop.status === "Rejected" && shop.rejectReason && <p className="reason">Lý do từ chối: {shop.rejectReason}</p>}
                {shop.status === "Pending" && <div className="partner-actions"><button onClick={() => review(shop, "Rejected")}>Từ chối</button><button onClick={() => review(shop, "Approved")}>Phê duyệt</button></div>}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function Users() {
  const { data: users, loading, reload } = useApi("/admin/users");
  const act = useAction(reload);
  const [keyword, setKeyword] = useState("");
  if (loading && !users) return <Loading />;
  const k = keyword.trim().toLowerCase();
  const visible = users.filter((u) => !k || [u.username, u.email, u.fullName].some((x) => x?.toLowerCase().includes(k)));
  return (
    <>
      <div className="toolbar-row"><input className="table-search" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm theo tên, email, tên đăng nhập..." /></div>
      <div className="management-table">
        <div className="table-head user-head"><span>Người dùng</span><span>Email</span><span>Vai trò</span><span>Trạng thái</span><span>Thao tác</span></div>
        {visible.map((user) => {
          const active = user.status === "Active";
          return (
            <div className="table-row user-head" key={user._id}>
              <span><b>{user.fullName || user.username}</b><small className="cell-sub">@{user.username} · {date(user.createdAt)}</small></span>
              <span>{user.email}</span>
              <span>{ROLE[user.role]}</span>
              <span className={`status-badge ${active ? "approved" : "rejected"}`}>{active ? "Đang hoạt động" : "Đã khóa"}</span>
              {user.role === "Admin" ? <span>—</span> : (
                <button className="text-action" onClick={() => act(`/admin/users/${user._id}/status`, "PATCH", { status: active ? "Locked" : "Active" }, active ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản")}>{active ? "Khóa" : "Mở khóa"}</button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Moderation() {
  const [status, setStatus] = useState("Pending");
  const { data: products, loading, reload } = useApi(`/admin/products${status ? `?status=${status}` : ""}`);
  const act = useAction(reload);
  const setApproval = (p, value, message) => act(`/admin/products/${p._id}/approval`, "PATCH", { status: value }, message);
  return (
    <>
      <div className="filter-tabs">{[["Pending", "Chờ duyệt"], ["Approved", "Đang bán"], ["Rejected", "Từ chối"], ["", "Tất cả"]].map(([value, label]) => <button key={label} className={status === value ? "active" : ""} onClick={() => setStatus(value)}>{label}</button>)}</div>
      {loading && !products ? <Loading /> : !products?.length ? <EmptyState title="Không có sản phẩm" text="Không có sản phẩm nào ở trạng thái này." /> : (
        <div className="moderation-grid">
          {products.map((product) => {
            const [label, cls] = APPROVAL[product.approvalStatus];
            return (
              <article key={product._id}>
                <img src={thumb(product)} alt={product.productName} />
                <div>
                  <span>{product.category?.categoryName} · {product.brand} · {product.shop?.shopName}</span>
                  <h2>{product.productName}</h2>
                  <p>{money(product.price)}</p>
                  <b className={`status-badge ${cls}`}>{label}</b>
                  <div>
                    <button disabled={product.approvalStatus === "Rejected"} onClick={() => setApproval(product, "Rejected", "Đã từ chối sản phẩm")}>Từ chối</button>
                    <button disabled={product.approvalStatus === "Approved"} onClick={() => setApproval(product, "Approved", "Đã duyệt sản phẩm")}>Phê duyệt</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function Categories() {
  const { data: categories, loading, reload } = useApi("/categories");
  const run = useAction(() => { clearCategoryCache(); reload(); });
  const empty = { categoryName: "", description: "", icon: "box" };
  const [draft, setDraft] = useState(empty);
  const submit = async (e) => {
    e.preventDefault();
    if (draft._id) await run(`/categories/${draft._id}`, "PUT", draft, "Đã cập nhật danh mục");
    else await run("/categories", "POST", draft, "Đã thêm danh mục");
    setDraft(empty);
  };
  return (
    <>
      <form className="seller-product-form category-form" onSubmit={submit}>
        <b>{draft._id ? "Sửa danh mục" : "Thêm danh mục"}</b>
        <input value={draft.categoryName} onChange={(e) => setDraft({ ...draft, categoryName: e.target.value })} placeholder="Tên danh mục" />
        <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Mô tả" />
        <div className="icon-picker" role="radiogroup" aria-label="Icon danh mục">
          {CATEGORY_ICONS.map((n) => (
            <button type="button" key={n} title={n} aria-label={n} aria-checked={draft.icon === n} role="radio" className={draft.icon === n ? "active" : ""} onClick={() => setDraft({ ...draft, icon: n })}><Icon name={n} size={15} /></button>
          ))}
        </div>
        <button className="primary-button" type="submit">{draft._id ? "Lưu" : "Thêm"}</button>
      </form>
      {loading && !categories ? <Loading /> : (
        <div className="management-table">
          <div className="table-head category-head"><span>Danh mục</span><span>Mô tả</span><span>Sản phẩm</span><span>Thao tác</span></div>
          {categories.map((c) => (
            <div className="table-row category-head" key={c._id}>
              <span className="table-product"><span className="category-icon"><Icon name={c.icon} size={18} /></span><b>{c.categoryName}</b></span>
              <span>{c.description}</span>
              <span>{c.productCount}</span>
              <span className="table-actions">
                <button onClick={() => setDraft({ _id: c._id, categoryName: c.categoryName, description: c.description, icon: c.icon })}>Sửa</button>
                <button onClick={() => window.confirm(`Xóa danh mục “${c.categoryName}”?`) && run(`/categories/${c._id}`, "DELETE", undefined, "Đã xóa danh mục")}>Xóa</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  return (
    <main className="dashboard-page admin">
      <aside className="dashboard-sidebar">
        <button className="logo light" onClick={() => navigate("/")}><span>N</span>NOVA</button>
        <p>Quản trị hệ thống</p>
        <nav>{Object.entries(TITLES).map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{key === "overview" ? "Tổng quan" : label}</button>)}</nav>
        <button className="back-store" onClick={() => navigate("/")}>Về trang mua sắm</button>
      </aside>
      <section className="dashboard-content">
        <div className="dashboard-top"><div><span>Quản trị viên</span><h1>{TITLES[tab]}</h1></div><div className="seller-chip"><span>QT</span><b>Quản trị NOVA</b></div></div>
        {tab === "overview" && <Overview setTab={setTab} />}
        {tab === "partners" && <Partners />}
        {tab === "users" && <Users />}
        {tab === "moderation" && <Moderation />}
        {tab === "categories" && <Categories />}
      </section>
    </main>
  );
}
