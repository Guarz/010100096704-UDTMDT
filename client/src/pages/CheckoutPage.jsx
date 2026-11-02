import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { Breadcrumb, Loading } from "../components/Common.jsx";
import { AddressForm, BuyerInfoForm, buyerInfoComplete } from "./AccountPage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { useApi } from "../lib/hooks.js";
import { money, thumb } from "../lib/format.js";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const notify = useToast();
  const { user } = useAuth();
  const { items, total, reload } = useCart();
  const { data: addresses, loading, reload: reloadAddresses } = useApi("/addresses");
  const [editingInfo, setEditingInfo] = useState(false);
  const [addressId, setAddressId] = useState("");
  const [payment, setPayment] = useState("COD");
  const [submitting, setSubmitting] = useState(false);
  // Bắt buộc có họ tên, SĐT và địa chỉ trước khi đặt hàng
  const infoComplete = buyerInfoComplete(user);
  const canOrder = infoComplete && Boolean(addressId) && !submitting;

  useEffect(() => {
    if (addresses?.length && !addresses.some((a) => a._id === addressId)) setAddressId((addresses.find((a) => a.isDefault) || addresses[0])._id);
  }, [addresses, addressId]);

  if (!items.length)
    return <main className="shell cart-page"><div className="cart-empty"><span><Icon name="box" size={36} /></span><h2>Chưa có sản phẩm để thanh toán</h2><p>Vui lòng quay lại giỏ hàng hoặc tiếp tục mua sắm.</p><button className="primary-button" onClick={() => navigate("/cart")}>Quay lại giỏ hàng</button></div></main>;

  const shopCount = new Set(items.map((i) => i.product.shop?._id)).size;
  const placeOrder = async () => {
    setSubmitting(true);
    try {
      const result = await api("/orders", { method: "POST", body: { addressId, paymentMethod: payment } });
      await reload();
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      notify("Đặt hàng thành công, thanh toán khi nhận hàng");
      navigate("/orders");
    } catch (err) {
      notify(err.message, "error");
      await reload();
    }
    setSubmitting(false);
  };

  return (
    <main className="checkout-page">
      <div className="shell">
        <Breadcrumb items={[{ label: "Giỏ hàng", to: "/cart" }, { label: "Thanh toán" }]} />
        <div className="page-heading"><span>Hoàn tất đơn hàng</span><h1>Thông tin thanh toán</h1><p>Kiểm tra địa chỉ và phương thức thanh toán trước khi xác nhận.</p></div>
        <div className="checkout-layout">
          <div className="checkout-main">
            <section className="checkout-card">
              <div className="checkout-title"><span>1</span><div><h2>Thông tin người mua</h2><p>Bắt buộc để NOVA liên hệ khi giao hàng.</p></div></div>
              {infoComplete && !editingInfo ? (
                <div className="buyer-summary"><span><b>{user.fullName}</b><small>{user.phone} · {user.email}</small></span><button className="text-action" onClick={() => setEditingInfo(true)}>Sửa</button></div>
              ) : (
                <>
                  {!infoComplete && <p className="checkout-warning">Tài khoản của bạn chưa có họ tên hoặc số điện thoại. Vui lòng bổ sung để tiếp tục đặt hàng.</p>}
                  <BuyerInfoForm onSaved={() => setEditingInfo(false)} />
                </>
              )}
            </section>
            <section className="checkout-card">
              <div className="checkout-title"><span>2</span><div><h2>Địa chỉ nhận hàng</h2><p>Chọn nơi bạn muốn nhận sản phẩm.</p></div></div>
              {addresses && !addresses.length && <p className="checkout-warning">Bạn chưa có địa chỉ nhận hàng. Vui lòng thêm địa chỉ để tiếp tục.</p>}
              {loading && !addresses ? <Loading /> : (
                <div className="checkout-addresses">
                  {addresses?.map((address) => (
                    <label className={addressId === address._id ? "selected" : ""} key={address._id}>
                      <input type="radio" name="address" checked={addressId === address._id} onChange={() => setAddressId(address._id)} />
                      <span><b>{address.recipientName} · {address.phone}</b><p>{address.street}, {address.city}</p>{address.isDefault && <small>Địa chỉ mặc định</small>}</span>
                    </label>
                  ))}
                </div>
              )}
              {addresses && !addresses.length && <AddressForm onSaved={reloadAddresses} />}
            </section>
            <section className="checkout-card">
              <div className="checkout-title"><span>3</span><div><h2>Phương thức thanh toán</h2><p>Lựa chọn hình thức thanh toán phù hợp.</p></div></div>
              <div className="payment-options">
                <label className={payment === "COD" ? "selected" : ""}><input type="radio" checked={payment === "COD"} onChange={() => setPayment("COD")} /><span><b>Thanh toán khi nhận hàng (COD)</b><small>Thanh toán bằng tiền mặt khi đơn hàng được giao</small></span></label>
                <label className={payment === "VNPay" ? "selected" : ""}><input type="radio" checked={payment === "VNPay"} onChange={() => setPayment("VNPay")} /><span><b>Thanh toán qua VNPay</b><small>Quét mã hoặc thanh toán qua ngân hàng hỗ trợ VNPay</small></span></label>
              </div>
            </section>
            <section className="checkout-card">
              <div className="checkout-title"><span>4</span><div><h2>Sản phẩm trong đơn</h2><p>{items.length} dòng sản phẩm{shopCount > 1 ? ` · tách thành ${shopCount} đơn theo cửa hàng` : ""}</p></div></div>
              <div className="checkout-products">{items.map(({ product, quantity }) => <div key={product._id}><img src={thumb(product)} alt={product.productName} /><span><b>{product.productName}</b><small>{product.shop?.shopName} · Số lượng: {quantity}</small></span><strong>{money(product.price * quantity)}</strong></div>)}</div>
            </section>
          </div>
          <aside className="order-summary checkout-summary">
            <h2>Đơn hàng của bạn</h2>
            <p><span>Tạm tính</span><b>{money(total)}</b></p>
            <p><span>Vận chuyển</span><b className="free">Miễn phí</b></p>
            <p><span>Giảm giá</span><b>0₫</b></p>
            <p className="total"><span>Tổng thanh toán</span><b>{money(total)}</b></p>
            <button className="primary-button wide" disabled={!canOrder} onClick={placeOrder}><Icon name="lock" size={17} /> {submitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}</button>
            {!infoComplete || !addressId ? <small className="checkout-missing">Cần bổ sung {[!user.fullName?.trim() && "họ tên", !user.phone?.trim() && "số điện thoại", !addressId && "địa chỉ nhận hàng"].filter(Boolean).join(", ")} để đặt hàng.</small> : null}
            <small>Bằng việc đặt hàng, bạn đồng ý với điều khoản mua sắm của NOVA.</small>
          </aside>
        </div>
      </div>
    </main>
  );
}
