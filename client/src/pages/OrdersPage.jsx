import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { Breadcrumb, Loading } from "../components/Common.jsx";
import { api } from "../lib/api.js";
import { useApi } from "../lib/hooks.js";
import { date, money, ORDER_STATUS, PAYMENT_STATUS } from "../lib/format.js";
import { useToast } from "../context/ToastContext.jsx";

export const statusClass = (status) => ({ Pending: "pending", Shipping: "shipping", Delivered: "approved", Canceled: "rejected" })[status];

export default function OrdersPage() {
  const navigate = useNavigate();
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const { data: orders, loading, reload } = useApi("/orders/my");

  useEffect(() => {
    const result = params.get("payment");
    if (!result) return;
    notify(result === "success" ? "Thanh toán VNPay thành công" : "Thanh toán chưa thành công, bạn có thể thử lại", result === "success" ? "success" : "error");
    setParams({}, { replace: true });
  }, [params, setParams, notify]);

  const cancel = async (order) => {
    if (!window.confirm(`Hủy đơn hàng ${order.code}?`)) return;
    try {
      await api(`/orders/${order._id}/cancel`, { method: "PATCH" });
      notify("Đã hủy đơn hàng");
      reload();
    } catch (err) {
      notify(err.message, "error");
    }
  };
  const pay = async (order) => {
    try {
      const { paymentUrl } = await api(`/orders/${order._id}/pay`, { method: "POST" });
      window.location.href = paymentUrl;
    } catch (err) {
      notify(err.message, "error");
    }
  };

  return (
    <main className="shell orders-page">
      <Breadcrumb items={[{ label: "Đơn hàng của tôi" }]} />
      <div className="page-heading"><span>Lịch sử mua sắm</span><h1>Đơn hàng của tôi</h1><p>Theo dõi trạng thái, thanh toán và đánh giá sản phẩm đã mua.</p></div>
      {loading && !orders ? <Loading /> : !orders?.length ? (
        <div className="cart-empty"><span><Icon name="box" size={36} /></span><h2>Bạn chưa có đơn hàng nào</h2><p>Các đơn hàng sau khi xác nhận sẽ xuất hiện tại đây.</p><button className="primary-button" onClick={() => navigate("/")}>Bắt đầu mua sắm</button></div>
      ) : (
        <div className="order-list">
          {orders.map((order) => {
            const p = order.payment;
            const unpaidVnpay = p?.paymentMethod === "VNPay" && p.paymentStatus !== "Paid" && order.orderStatus !== "Canceled";
            return (
              <article key={order._id}>
                <header>
                  <div><b>Đơn hàng #{order.code}</b><small>Đặt ngày {date(order.orderDate)} · {order.shop?.shopName}</small></div>
                  <span className={`order-status ${statusClass(order.orderStatus)}`}>{ORDER_STATUS[order.orderStatus]}</span>
                </header>
                <div className="order-products">
                  {order.items.map((item) => (
                    <div key={item._id}>
                      <img src={item.image} alt={item.productName} />
                      <span><Link to={`/product/${item.product}`}><b>{item.productName}</b></Link><small>Số lượng: {item.quantity} × {money(item.unitPrice)}</small></span>
                      {order.orderStatus === "Delivered" && <Link className="text-action" to={`/product/${item.product}`}>Đánh giá</Link>}
                      <strong>{money(item.unitPrice * item.quantity)}</strong>
                    </div>
                  ))}
                </div>
                <footer>
                  <span>Thanh toán: {p?.paymentMethod === "VNPay" ? "VNPay" : "Khi nhận hàng"} · <em className={p?.paymentStatus === "Paid" ? "paid" : ""}>{PAYMENT_STATUS[p?.paymentStatus] || "—"}</em></span>
                  <div className="order-actions">
                    {unpaidVnpay && <button className="text-action" onClick={() => pay(order)}>Thanh toán lại</button>}
                    {order.orderStatus === "Pending" && <button className="text-action danger" onClick={() => cancel(order)}>Hủy đơn</button>}
                    <p>Tổng cộng: <b>{money(order.totalAmount)}</b></p>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
