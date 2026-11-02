import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import { EmptyState, Loading } from "./components/Common.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import MockPaymentPage from "./pages/MockPaymentPage.jsx";
import SellerDashboard from "./pages/SellerDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

function StoreLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

// Chặn trang cần đăng nhập / cần vai trò cụ thể
function RequireAuth({ roles, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <main className="shell cart-page"><Loading /></main>;
  if (!user) return <Navigate to="/account" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <main className="shell cart-page"><EmptyState title="Bạn không có quyền truy cập" text="Trang này chỉ dành cho tài khoản có quyền phù hợp." /></main>;
  return children;
}

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/category/:id" element={<Catalog />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/checkout" element={<RequireAuth roles={["Buyer", "Seller"]}><CheckoutPage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/payment/mock" element={<RequireAuth><MockPaymentPage /></RequireAuth>} />
          <Route path="*" element={<main className="shell cart-page"><EmptyState title="Không tìm thấy trang" text="Đường dẫn không tồn tại." /></main>} />
        </Route>
        <Route path="/seller" element={<RequireAuth roles={["Seller"]}><SellerDashboard /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth roles={["Admin"]}><AdminDashboard /></RequireAuth>} />
      </Routes>
    </div>
  );
}
