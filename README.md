# NOVA – Website thương mại điện tử

- **Frontend:** React 19 + Vite + React Router, viết bằng **JavaScript** (`client/`). Giao diện chuyển từ bản thiết kế Figma Make "Website thương mại điện tử".
- **Backend:** Node.js + Express + Mongoose (`server/`), database MongoDB Atlas **Cluster0 → TMDT**.

## Chạy dự án

Cần Node.js 18 trở lên.

### 1. Cấu hình backend

Mở `server/.env` và điền chuỗi kết nối Atlas (Atlas → Cluster0 → **Connect** → **Drivers**):

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB=TMDT
JWT_SECRET=mot-chuoi-bi-mat-dai
```

Trong Atlas → **Network Access**, thêm IP của máy bạn (hoặc `0.0.0.0/0` khi demo).

### 2. Cài đặt và tạo dữ liệu mẫu

```bash
cd server
npm install
npm run seed     # tạo dữ liệu mẫu khi database TMDT còn trống
# npm run seed -- --reset   # XÓA toàn bộ dữ liệu trong TMDT rồi tạo lại
npm run dev      # API chạy tại http://localhost:5000
```

### 3. Chạy frontend (terminal khác)

```bash
cd client
npm install
npm run dev      # http://localhost:5173 (tự proxy /api sang cổng 5000)
```

### Tài khoản mẫu (mật khẩu: `123456`)

| Vai trò | Đăng nhập | Ghi chú |
|---|---|---|
| Admin | `admin` | Quản trị người dùng, duyệt sản phẩm, danh mục |
| Seller | `novastore` | Shop "NOVA Store" |
| Seller | `techzone` | Shop "TechZone", có 2 sản phẩm chờ duyệt |
| Buyer | `minhanh` | Có địa chỉ, đơn hàng, 1 đơn chờ xác nhận |
| Buyer | `quocbao` | Có yêu cầu đối tác "Bảo Gear" đang chờ duyệt (chỉ khi seed database mới) |
| Buyer | `hoangnam` | Tài khoản đã bị khóa |

## Deploy lên Render.com

Dự án là Node.js nên **không cần `requirements.txt`** (file đó chỉ dành cho Python). Render đọc `package.json` ở thư mục gốc:

- `npm run build`: cài thư viện cho `server/`, `client/` và build giao diện React ra `client/dist`
- `npm start`: chạy Express; Express vừa phục vụ API `/api/*` vừa trả giao diện trong `client/dist` → chỉ cần **1 Web Service**

**Cách 1: Blueprint (dùng `render.yaml`)**: Render → **New → Blueprint** → chọn repo GitHub → nhập các biến được hỏi.

**Cách 2: tạo tay**: Render → **New → Web Service** → chọn repo, Runtime **Node**, Build Command `npm run build`, Start Command `npm start`, Health Check Path `/api/health`.

Biến môi trường cần khai báo trên Render (không đưa file `.env` lên GitHub):

| Biến | Giá trị |
|---|---|
| `MONGODB_URI` | Chuỗi kết nối Atlas Cluster0 (giống `server/.env`) |
| `MONGODB_DB` | `TMDT` |
| `JWT_SECRET` | Chuỗi bí mật dài, ngẫu nhiên |
| `CLIENT_URL`, `SERVER_URL` | URL của service, VD `https://nova-ecommerce.onrender.com` |
| `VNP_TMN_CODE`, `VNP_HASH_SECRET` | (tùy chọn) VNPay sandbox |

Atlas → **Network Access** phải cho phép IP của Render (đang mở `0.0.0.0/0` nên đã được). Gói Free của Render sẽ "ngủ" sau 15 phút không có truy cập, lần mở đầu tiên mất khoảng 30–60 giây.

## Chức năng

**Đăng ký:** chỉ cần tên đăng nhập, email, mật khẩu. Họ tên, số điện thoại, địa chỉ để trống và bổ sung trong **Tài khoản → Thông tin cá nhân / Sổ địa chỉ**. Khi đặt hàng bắt buộc phải có đủ họ tên, số điện thoại hợp lệ và ít nhất 1 địa chỉ (trang thanh toán cho nhập trực tiếp; server cũng kiểm tra lại).

**Người mua:** xem/tìm kiếm/lọc sản phẩm (giá, thương hiệu, đánh giá, tồn kho, thông số), gợi ý tìm kiếm, giỏ hàng (khách chưa đăng nhập vẫn thêm được, tự gộp khi đăng nhập), sổ địa chỉ, đặt hàng COD/VNPay, theo dõi – hủy – thanh toán lại đơn, đánh giá sản phẩm (chỉ khi đã nhận hàng), hồ sơ, đổi mật khẩu.

**Trở thành đối tác:** mọi tài khoản đăng ký đều là người mua. Sau khi đăng nhập, vào **Tài khoản → Trở thành đối tác**, nhập tên shop, giới thiệu và một hoặc nhiều địa chỉ cửa hàng rồi gửi yêu cầu. Quản trị viên duyệt ở **Quản trị → Duyệt đối tác**: phê duyệt thì tài khoản thành người bán; từ chối phải kèm lý do, người dùng sửa và gửi lại được.

**Người bán:** thống kê (doanh thu tháng, đơn chờ, sắp hết hàng, chờ duyệt), thêm/sửa/xóa sản phẩm (nhiều ảnh, thông số), xử lý đơn (Chờ xác nhận → Đang giao → Đã giao, hoặc Hủy), sửa thông tin và địa chỉ shop.

**Quản trị:** thống kê hệ thống, duyệt yêu cầu đối tác, khóa/mở khóa tài khoản, duyệt/từ chối sản phẩm, quản lý danh mục.

## Thanh toán VNPay

- Mặc định (chưa cấu hình) → chuyển tới **trang VNPay mô phỏng** `/payment/mock` để xác nhận/hủy giao dịch.
- Dùng **VNPay sandbox thật**: đăng ký tại https://sandbox.vnpayment.vn, điền `VNP_TMN_CODE`, `VNP_HASH_SECRET` trong `server/.env`. URL trả về: `SERVER_URL/api/payments/vnpay-return`.

## Thiết kế dữ liệu (theo ERD, có điều chỉnh cho MongoDB)

| ERD | Collection | Thay đổi |
|---|---|---|
| USER | `users` | Thêm `fullName`, `phone`, `birthday`. Mật khẩu mã hóa bcrypt |
| ADDRESS (giao hàng) | nhúng trong `users` (`addresses[]`) | Thêm `recipientName`, `phone`, `isDefault`. Sổ địa chỉ luôn đọc cùng user, ít phần tử |
| SHOP | `shops` | 1 user – 1 shop. Thêm `addresses[]` (nhiều chi nhánh/kho), `status` Pending/Approved/Rejected, `rejectReason` cho yêu cầu đối tác |
| CATEGORY | `categories` | Thêm `icon` |
| PRODUCT | `products` | Thêm `brand`, `description`, `oldPrice`, `rating`, `reviewCount`, `sold`; `ApprovalStatus` thêm `Rejected` |
| PRODUCT_IMAGE, PRODUCT_SPECIFICATION | nhúng trong `products` (`images[]`, `specifications[]`) | Luôn đọc cùng sản phẩm nên nhúng để truy vấn 1 lần |
| CART, CART_ITEM | `carts` (`items[]` nhúng) | 1 buyer – 1 cart |
| ORDER, ORDER_ITEM | `orders` (`items[]` nhúng) | Thêm `code`, `shippingAddress` (lưu bản sao), `OrderStatus` thêm `Pending`; giỏ có nhiều shop được tách thành nhiều đơn |
| PAYMENT | `payments` | Thêm `amount`, `transactionRef`, `paidAt`; trạng thái `Pending/Paid/Failed/Refunded` |
| REVIEW | `reviews` | Mỗi người mua đánh giá 1 sản phẩm 1 lần |

Mỗi thực thể con được nhúng vẫn có `_id` riêng (tương ứng ImageID, SpecID, CartItemID, OrderItemID).

## Cấu trúc thư mục

```
server/src/
  models/        Mongoose schema theo ERD
  routes/        auth, addresses, partner, categories, products, cart, orders, payments, seller, admin
  migrations/    embed-addresses.js (chuyển collection addresses cũ vào users)
  utils/         vnpay.js (ký HMAC SHA512), orders.js (tồn kho, thanh toán)
  seed.js        dữ liệu mẫu
client/src/
  pages/         Home, Catalog, SearchResults, ProductDetail, Cart, Checkout, Orders, Account, Seller, Admin, MockPayment
  components/    Header, Footer, ProductCard, Icon, Common
  context/       Auth, Cart, Toast
  styles/        design.css (từ Figma), extra.css (phần bổ sung)
```
