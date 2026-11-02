import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import ShopAddressesEditor, { toEditable } from "../components/ShopAddressesEditor.jsx";
import { Breadcrumb, Loading } from "../components/Common.jsx";
import { api } from "../lib/api.js";
import { useApi } from "../lib/hooks.js";
import { initials, ROLE } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

// Thông tin bắt buộc để mua hàng: họ tên + số điện thoại (địa chỉ kiểm tra riêng)
export const buyerInfoComplete = (user) => Boolean(user?.fullName?.trim() && user?.phone?.trim());

export function BuyerInfoForm({ onSaved }) {
  const { user, setUser } = useAuth();
  const notify = useToast();
  const [values, setValues] = useState({ fullName: user.fullName || "", phone: user.phone || "" });
  const submit = async (e) => {
    e.preventDefault();
    if (!values.fullName.trim() || !values.phone.trim()) return notify("Vui lòng nhập họ tên và số điện thoại", "error");
    try {
      const { user: updated } = await api("/auth/me", { method: "PUT", body: values });
      setUser(updated);
      notify("Đã lưu thông tin người mua");
      onSaved?.();
    } catch (err) {
      notify(err.message, "error");
    }
  };
  return (
    <form className="address-form" onSubmit={submit}>
      <b>Thông tin người mua</b>
      <div>
        <input value={values.fullName} onChange={(e) => setValues({ ...values, fullName: e.target.value })} placeholder="Họ và tên" />
        <input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} placeholder="Số điện thoại (VD: 0901 234 567)" />
      </div>
      <button className="primary-button" type="submit">Lưu thông tin</button>
    </form>
  );
}

export function AddressForm({ onSaved }) {
  const notify = useToast();
  const { user } = useAuth();
  const empty = { recipientName: user?.fullName || "", phone: user?.phone || "", street: "", city: "" };
  const [values, setValues] = useState(empty);
  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (Object.values(values).some((v) => !v.trim())) return notify("Vui lòng nhập đủ thông tin địa chỉ", "error");
    try {
      await api("/addresses", { method: "POST", body: values });
      setValues(empty);
      notify("Đã thêm địa chỉ mới");
      onSaved();
    } catch (err) {
      notify(err.message, "error");
    }
  };
  return (
    <form className="address-form" onSubmit={submit}>
      <b>Thêm địa chỉ mới</b>
      <div><input value={values.recipientName} onChange={set("recipientName")} placeholder="Tên người nhận" /><input value={values.phone} onChange={set("phone")} placeholder="Số điện thoại" /></div>
      <div><input value={values.street} onChange={set("street")} placeholder="Số nhà, tên đường, phường/xã, quận/huyện" /><input value={values.city} onChange={set("city")} placeholder="Tỉnh / Thành phố" /></div>
      <button className="primary-button" type="submit">Thêm địa chỉ</button>
    </form>
  );
}

function AddressBook() {
  const notify = useToast();
  const { data: addresses, loading, reload } = useApi("/addresses");
  const act = async (path, method, message) => {
    try {
      await api(path, { method });
      notify(message);
      reload();
    } catch (err) {
      notify(err.message, "error");
    }
  };
  return (
    <>
      <div className="panel-heading"><span>Giao hàng</span><h1>Sổ địa chỉ</h1><p>Quản lý địa chỉ dùng khi thanh toán đơn hàng.</p></div>
      {loading && !addresses ? <Loading /> : (
        <div className="address-list">
          {addresses?.map((a) => (
            <article key={a._id}>
              <div><b>{a.recipientName}{a.isDefault && <span>Mặc định</span>}</b><small>{a.phone}</small><p>{a.street}, {a.city}</p></div>
              <div className="address-actions">
                {!a.isDefault && <button onClick={() => act(`/addresses/${a._id}/default`, "PATCH", "Đã đặt làm địa chỉ mặc định")}>Đặt mặc định</button>}
                <button className="danger" onClick={() => act(`/addresses/${a._id}`, "DELETE", "Đã xóa địa chỉ")}><Icon name="trash" size={15} /> Xóa</button>
              </div>
            </article>
          ))}
        </div>
      )}
      <AddressForm onSaved={reload} />
    </>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const notify = useToast();
  const [values, setValues] = useState({
    fullName: user.fullName || "",
    phone: user.phone || "",
    email: user.email,
    birthday: user.birthday ? user.birthday.slice(0, 10) : "",
  });
  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const { user: updated } = await api("/auth/me", { method: "PUT", body: values });
      setUser(updated);
      notify("Đã lưu thông tin cá nhân");
    } catch (err) {
      notify(err.message, "error");
    }
  };
  return (
    <>
      <div className="panel-heading"><span>Hồ sơ</span><h1>Thông tin cá nhân</h1><p>Cập nhật thông tin để NOVA hỗ trợ bạn tốt hơn.</p></div>
      {!buyerInfoComplete(user) && <div className="profile-hint"><Icon name="lock" size={15} /> Bạn cần nhập <b>họ và tên</b>, <b>số điện thoại</b> và ít nhất một <b>địa chỉ</b> trong Sổ địa chỉ để có thể đặt hàng.</div>}
      <form className="profile-form" onSubmit={submit}>
        <label>Họ và tên<input value={values.fullName} onChange={set("fullName")} placeholder="Chưa cập nhật" /></label>
        <label>Số điện thoại<input value={values.phone} onChange={set("phone")} placeholder="Chưa cập nhật" /></label>
        <label>Địa chỉ email<input type="email" value={values.email} onChange={set("email")} /></label>
        <label>Ngày sinh<input type="date" value={values.birthday} onChange={set("birthday")} /></label>
        <label>Tên đăng nhập<input value={user.username} disabled /></label>
        <label>Vai trò<input value={ROLE[user.role]} disabled /></label>
        <button className="primary-button" type="submit">Lưu thay đổi</button>
      </form>
    </>
  );
}

function PasswordForm() {
  const notify = useToast();
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (values.newPassword !== values.confirm) return notify("Mật khẩu xác nhận chưa khớp", "error");
    try {
      await api("/auth/me/password", { method: "PUT", body: values });
      setValues({ currentPassword: "", newPassword: "", confirm: "" });
      notify("Đổi mật khẩu thành công");
    } catch (err) {
      notify(err.message, "error");
    }
  };
  return (
    <>
      <div className="panel-heading"><span>Bảo mật</span><h1>Đổi mật khẩu</h1><p>Nên sử dụng mật khẩu mạnh và không dùng lại ở nơi khác.</p></div>
      <form className="profile-form narrow" onSubmit={submit}>
        <label>Mật khẩu hiện tại<input type="password" value={values.currentPassword} onChange={set("currentPassword")} required /></label>
        <label>Mật khẩu mới<input type="password" minLength={6} value={values.newPassword} onChange={set("newPassword")} required /></label>
        <label>Xác nhận mật khẩu mới<input type="password" minLength={6} value={values.confirm} onChange={set("confirm")} required /></label>
        <button className="primary-button" type="submit">Cập nhật mật khẩu</button>
      </form>
    </>
  );
}

const PARTNER_STATUS = {
  Pending: ["Đang chờ duyệt", "pending", "Quản trị viên đang xem xét yêu cầu của bạn. Bạn sẽ có quyền vào Kênh người bán ngay khi được duyệt."],
  Approved: ["Đã duyệt", "approved", "Chúc mừng! Cửa hàng của bạn đã được duyệt."],
  Rejected: ["Bị từ chối", "rejected", "Yêu cầu chưa được chấp nhận. Bạn có thể chỉnh sửa thông tin và gửi lại."],
};

function PartnerRequest() {
  const navigate = useNavigate();
  const { user, shop, setShop } = useAuth();
  const notify = useToast();
  const [values, setValues] = useState({ shopName: shop?.shopName || "", description: shop?.description || "", addresses: toEditable(shop?.addresses) });
  const [busy, setBusy] = useState(false);
  const status = shop ? PARTNER_STATUS[shop.status] : null;
  const canSubmit = user.role === "Buyer" && (!shop || shop.status === "Rejected");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setShop(await api("/partner", { method: "POST", body: values }));
      notify("Đã gửi yêu cầu trở thành đối tác");
    } catch (err) {
      notify(err.message, "error");
    }
    setBusy(false);
  };

  return (
    <>
      <div className="panel-heading"><span>Bán hàng cùng NOVA</span><h1>Trở thành đối tác</h1><p>Gửi thông tin cửa hàng để quản trị viên xét duyệt. Sau khi được duyệt, bạn có thể đăng bán sản phẩm và quản lý đơn hàng.</p></div>
      {status && (
        <div className={`partner-status ${status[1]}`}>
          <div><b>{shop.shopName}</b><span className={`status-badge ${status[1]}`}>{status[0]}</span></div>
          <p>{status[2]}</p>
          {shop.status === "Rejected" && shop.rejectReason && <p className="reason">Lý do: {shop.rejectReason}</p>}
          {shop.status === "Approved" && user.role === "Seller" && <button className="primary-button" onClick={() => navigate("/seller")}>Vào Kênh người bán <Icon name="arrow" size={16} /></button>}
        </div>
      )}
      {canSubmit && (
        <form className="seller-product-form product-editor partner-form" onSubmit={submit}>
          <b>{shop ? "Cập nhật và gửi lại yêu cầu" : "Thông tin cửa hàng"}</b>
          <label className="wide">Tên cửa hàng<input value={values.shopName} onChange={(e) => setValues({ ...values, shopName: e.target.value })} placeholder="VD: Minh Anh Mobile" /></label>
          <label className="wide">Giới thiệu cửa hàng<textarea value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} placeholder="Mặt hàng kinh doanh, kinh nghiệm bán hàng..." /></label>
          <ShopAddressesEditor value={values.addresses} onChange={(addresses) => setValues({ ...values, addresses })} />
          <div className="wide editor-actions"><button className="primary-button" type="submit" disabled={busy}>Gửi yêu cầu duyệt</button></div>
        </form>
      )}
    </>
  );
}

function MemberPage() {
  const navigate = useNavigate();
  const { user, shop, logout, refresh } = useAuth();
  const notify = useToast();
  const [tab, setTab] = useState("profile");
  const name = user.fullName || user.username;
  // Cập nhật trạng thái yêu cầu đối tác / vai trò mỗi khi vào trang tài khoản
  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);
  return (
    <main className="shell member-page">
      <Breadcrumb items={[{ label: "Tài khoản của tôi" }]} />
      <div className="member-layout">
        <aside className="member-nav">
          <div className="member-user"><span>{initials(name)}</span><div><b>{name}</b><small>{shop?.status === "Approved" ? shop.shopName : ROLE[user.role]}</small></div></div>
          <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>Thông tin cá nhân</button>
          <button className={tab === "address" ? "active" : ""} onClick={() => setTab("address")}>Sổ địa chỉ</button>
          <button className={tab === "password" ? "active" : ""} onClick={() => setTab("password")}>Đổi mật khẩu</button>
          <button onClick={() => navigate("/orders")}>Đơn hàng của tôi</button>
          {(user.role === "Buyer" || shop) && user.role !== "Admin" && (
            <button className={tab === "partner" ? "active" : ""} onClick={() => setTab("partner")}>
              Trở thành đối tác{shop?.status === "Pending" && <em className="nav-badge">Chờ duyệt</em>}
            </button>
          )}
          {user.role !== "Buyer" && (
            <div className="management-links">
              <small>Khu vực quản lý</small>
              {user.role === "Seller" && <button onClick={() => navigate("/seller")}>Cửa hàng người bán</button>}
              {user.role === "Admin" && <button onClick={() => navigate("/admin")}>Quản trị hệ thống</button>}
            </div>
          )}
          <div className="management-links"><button className="logout" onClick={() => { logout(); notify("Đã đăng xuất"); navigate("/"); }}>Đăng xuất</button></div>
        </aside>
        <section className="member-content">
          {tab === "profile" && <ProfileForm />}
          {tab === "password" && <PasswordForm />}
          {tab === "address" && <AddressBook />}
          {tab === "partner" && <PartnerRequest />}
        </section>
      </div>
    </main>
  );
}

function AuthForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const notify = useToast();
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({ login: "", username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value });
  const isRegister = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    if (isRegister) {
      if (values.username.trim().length < 3) return setError("Tên đăng nhập cần ít nhất 3 ký tự.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return setError("Vui lòng nhập đúng địa chỉ email.");
    } else if (!values.login.trim()) return setError("Vui lòng nhập email hoặc tên đăng nhập.");
    if (values.password.length < 6) return setError("Mật khẩu cần có ít nhất 6 ký tự.");
    if (isRegister && values.password !== values.confirm) return setError("Mật khẩu xác nhận chưa khớp.");
    setError("");
    setBusy(true);
    try {
      const { username, email, password } = values;
      const user = isRegister ? await register({ username, email, password }) : await login(values.login, password);
      notify(isRegister ? "Đăng ký tài khoản thành công" : `Chào mừng ${user.fullName || user.username} trở lại`);
      const from = location.state?.from;
      if (from) navigate(from);
      else if (user.role === "Admin") navigate("/admin");
      else if (user.role === "Seller") navigate("/seller");
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <main className="account-page">
      <div className="auth-card">
        <div className="auth-brand"><div className="logo light"><span>N</span>NOVA</div><h1>Công nghệ trong tầm tay</h1><p>Đăng nhập để theo dõi đơn hàng, lưu sản phẩm yêu thích và nhận ưu đãi dành riêng cho bạn.</p><ul><li><Icon name="check" size={15} /> Quản lý đơn hàng thuận tiện</li><li><Icon name="check" size={15} /> Trở thành đối tác bán hàng của NOVA</li><li><Icon name="check" size={15} /> Dữ liệu được bảo vệ</li></ul></div>
        <form onSubmit={submit}>
          <span>Tài khoản NOVA</span><h2>{isRegister ? "Tạo tài khoản mới" : "Chào mừng bạn trở lại"}</h2><p>{isRegister ? "Chỉ cần tên đăng nhập, email và mật khẩu. Thông tin giao hàng bổ sung sau khi mua sắm." : "Đăng nhập bằng email hoặc tên đăng nhập."}</p>
          {isRegister ? (
            <>
              <label>Tên đăng nhập<input value={values.username} onChange={set("username")} placeholder="nguyenvanan" autoComplete="username" /></label>
              <label>Địa chỉ email<input type="email" value={values.email} onChange={set("email")} placeholder="ban@example.com" autoComplete="email" /></label>
            </>
          ) : (
            <label>Email hoặc tên đăng nhập<input value={values.login} onChange={set("login")} placeholder="ban@example.com" autoComplete="username" /></label>
          )}
          <label>Mật khẩu<input type="password" value={values.password} onChange={set("password")} placeholder="Tối thiểu 6 ký tự" autoComplete={isRegister ? "new-password" : "current-password"} /></label>
          {isRegister && <label>Xác nhận mật khẩu<input type="password" value={values.confirm} onChange={set("confirm")} placeholder="Nhập lại mật khẩu" autoComplete="new-password" /></label>}
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button wide" type="submit" disabled={busy}>{isRegister ? "Đăng ký tài khoản" : "Đăng nhập"} <Icon name="arrow" size={16} /></button>
          <div className="auth-switch">{isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}<button type="button" onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); }}>{isRegister ? "Đăng nhập" : "Đăng ký ngay"}</button></div>
        </form>
      </div>
    </main>
  );
}

export default function AccountPage() {
  const { user, ready } = useAuth();
  if (!ready) return <main className="shell member-page"><Loading /></main>;
  return user ? <MemberPage /> : <AuthForm />;
}
