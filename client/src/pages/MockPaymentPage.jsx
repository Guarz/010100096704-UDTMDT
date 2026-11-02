import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { EmptyState, Loading } from "../components/Common.jsx";
import { api } from "../lib/api.js";
import { useApi } from "../lib/hooks.js";
import { money } from "../lib/format.js";

// Cổng VNPay mô phỏng, dùng khi server chưa cấu hình VNP_TMN_CODE / VNP_HASH_SECRET
export default function MockPaymentPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ref = params.get("ref");
  const { data, error, loading } = useApi(ref ? `/payments/mock/${ref}` : null);
  const [busy, setBusy] = useState(false);

  const finish = async (success) => {
    setBusy(true);
    await api(`/payments/mock/${ref}`, { method: "POST", body: { success } }).catch(() => {});
    navigate(`/orders?payment=${success ? "success" : "failed"}`);
  };

  if (!ref || error) return <main className="shell cart-page"><EmptyState title="Không tìm thấy giao dịch" text="Liên kết thanh toán không hợp lệ hoặc đã hết hạn." /></main>;
  if (loading || !data) return <main className="shell cart-page"><Loading /></main>;

  return (
    <main className="account-page">
      <div className="pay-card">
        <div className="pay-head"><b>VNPAY</b><span>Cổng thanh toán mô phỏng (sandbox)</span></div>
        <div className="pay-body">
          <p><span>Mã giao dịch</span><b>{data.ref}</b></p>
          <p><span>Đơn hàng</span><b>{data.orders.map((c) => `#${c}`).join(", ")}</b></p>
          <p className="pay-amount"><span>Số tiền thanh toán</span><b>{money(data.amount)}</b></p>
          {data.status === "Paid" ? (
            <button className="primary-button wide" onClick={() => navigate("/orders")}>Giao dịch đã thanh toán · Xem đơn hàng</button>
          ) : (
            <>
              <button className="primary-button wide" disabled={busy} onClick={() => finish(true)}><Icon name="lock" size={17} /> Xác nhận thanh toán</button>
              <button className="continue-button" disabled={busy} onClick={() => finish(false)}>Hủy giao dịch</button>
            </>
          )}
          <small>Trang này thay thế cổng VNPay khi chưa cấu hình mã TMN. Điền VNP_TMN_CODE và VNP_HASH_SECRET trong server/.env để dùng VNPay sandbox thật.</small>
        </div>
      </div>
    </main>
  );
}
