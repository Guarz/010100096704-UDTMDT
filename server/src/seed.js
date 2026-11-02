// Tạo dữ liệu mẫu: npm run seed           (chỉ chạy khi database còn trống)
//                  npm run seed -- --reset (XÓA toàn bộ dữ liệu cũ rồi tạo lại)
import mongoose from "mongoose";
import { connectDb } from "./db.js";
import User from "./models/User.js";
import Shop from "./models/Shop.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import Cart from "./models/Cart.js";
import Order from "./models/Order.js";
import Payment from "./models/Payment.js";
import Review from "./models/Review.js";

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;

const CATEGORIES = [
  ["Điện thoại", "phone", "Điện thoại thông minh chính hãng"],
  ["Laptop", "laptop", "Laptop văn phòng, đồ họa và gaming"],
  ["Linh kiện PC", "cpu", "CPU, VGA và linh kiện máy tính"],
  ["Màn hình", "monitor", "Màn hình văn phòng và gaming"],
  ["Bàn phím", "keyboard", "Bàn phím cơ và không dây"],
  ["Chuột", "mouse", "Chuột văn phòng và gaming"],
  ["Tai nghe", "headphone", "Tai nghe chống ồn, true wireless"],
];

// [tên, thương hiệu, danh mục, giá, giá cũ, tồn kho, ảnh, [[thông số, giá trị]...], shop (0|1)]
const PRODUCTS = [
  ["Điện thoại Apple iPhone 16 Pro Max 256GB", "Apple", "Điện thoại", 30990000, 34990000, 25, "photo-1668714341253-81139e265a19", [["Màn hình", "6.9 inch"], ["Chip", "Apple A18 Pro"], ["Camera", "48 MP"]], 0],
  ["Điện thoại Samsung Galaxy S25 Ultra 5G", "Samsung", "Điện thoại", 28990000, 33990000, 18, "photo-1566492625401-af879a7559f0", [["Màn hình", "Dynamic AMOLED"], ["Bộ nhớ", "256GB"], ["Camera", "200 MP"]], 0],
  ["Laptop Apple MacBook Air M4 13 inch", "Apple", "Laptop", 26990000, 29990000, 12, "photo-1655226569940-b0ed83f6e268", [["Chip", "Apple M4"], ["RAM", "16GB"], ["SSD", "256GB"]], 0],
  ["Laptop ASUS ROG Strix G16 Gaming", "ASUS", "Laptop", 38990000, 42990000, 7, "photo-1617642404759-30bc2914193d", [["CPU", "Intel Core i9"], ["RAM", "32GB"], ["GPU", "RTX 4070"]], 1],
  ["Card đồ họa NVIDIA GeForce RTX 5070", "NVIDIA", "Linh kiện PC", 18990000, 20990000, 9, "photo-1626218174358-7769486c4b79", [["Bộ nhớ", "12GB GDDR7"], ["Công nghệ", "DLSS 4"], ["Hỗ trợ", "Ray Tracing"]], 1],
  ["Bộ vi xử lý AMD Ryzen 7 9800X3D", "AMD", "Linh kiện PC", 12990000, 13990000, 0, "photo-1696710257827-75e2e5954059", [["Số nhân", "8 nhân 16 luồng"], ["Xung nhịp", "5.2GHz"], ["Socket", "AM5"]], 1],
  ["Màn hình Gaming LG UltraGear 27 inch", "LG", "Màn hình", 8490000, 9990000, 15, "photo-1603481588273-2f908a9a7a1b", [["Độ phân giải", "QHD"], ["Tần số", "180Hz"], ["Tấm nền", "Nano IPS"]], 1],
  ["Màn hình Samsung Odyssey OLED G8", "Samsung", "Màn hình", 21990000, 24990000, 6, "photo-1593640408182-31c70c8268f5", [["Kích thước", "34 inch"], ["Tần số", "175Hz"], ["Tấm nền", "OLED"]], 0],
  ["Bàn phím cơ Keychron K8 Pro không dây", "Keychron", "Bàn phím", 2490000, 2890000, 40, "photo-1636489953081-c4ebbd50fa3a", [["Kết nối", "Bluetooth"], ["Switch", "Hot-swap"], ["Đèn nền", "RGB"]], 1],
  ["Chuột không dây Logitech MX Master 3S", "Logitech", "Chuột", 2190000, 2490000, 50, "photo-1587831990711-23ca6441447b", [["Cảm biến", "8000 DPI"], ["Kết nối", "Đa thiết bị"], ["Sạc", "USB-C"]], 0],
  ["Tai nghe Sony WH-1000XM5 chống ồn", "Sony", "Tai nghe", 6990000, 8490000, 20, "photo-1605170876472-db58e15c430e", [["Chống ồn", "Chủ động"], ["Pin", "30 giờ"], ["Âm thanh", "Hi-Res"]], 0],
  ["Tai nghe Apple AirPods Pro thế hệ 2", "Apple", "Tai nghe", 5490000, 6190000, 35, "photo-1620812544987-449d7bd5adfd", [["Chip", "Apple H2"], ["Chống ồn", "Chủ động"], ["Sạc", "MagSafe"]], 0],
];

const PENDING = [
  ["Bàn phím cơ AKKO 5075B Plus", "AKKO", "Bàn phím", 1890000, 2190000, 30, "photo-1636489953081-c4ebbd50fa3a", [["Layout", "75%"], ["Kết nối", "3 chế độ"]], 1],
  ["Chuột gaming Razer DeathAdder V3", "Razer", "Chuột", 1690000, 1990000, 22, "photo-1587831990711-23ca6441447b", [["Cảm biến", "30000 DPI"], ["Trọng lượng", "59g"]], 1],
];

const REVIEW_TEXTS = [
  [5, "Sản phẩm đóng gói kỹ, giao nhanh và hoạt động ổn định. Nhân viên tư vấn rất nhiệt tình."],
  [5, "Thiết kế đẹp, hiệu năng đúng với nhu cầu. Tôi hài lòng với chính sách bảo hành của NOVA."],
  [4, "Chất lượng tốt so với giá, giao hàng hơi chậm một chút nhưng vẫn ổn."],
];

async function seed() {
  await connectDb();
  const models = [User, Shop, Category, Product, Cart, Order, Payment, Review];
  const existing = (await Promise.all(models.map((m) => m.estimatedDocumentCount()))).reduce((a, b) => a + b, 0);
  if (existing > 0) {
    if (!process.argv.includes("--reset")) {
      console.log(`Database đã có ${existing} bản ghi, bỏ qua seed. Dùng "npm run seed -- --reset" để xóa và tạo lại.`);
      return mongoose.disconnect();
    }
    await Promise.all(models.map((m) => m.deleteMany({})));
  }

  const categories = await Category.insertMany(CATEGORIES.map(([categoryName, icon, description]) => ({ categoryName, icon, description })));
  const catId = Object.fromEntries(categories.map((c) => [c.categoryName, c._id]));

  // Tài khoản mẫu (mật khẩu chung: 123456). Địa chỉ giao hàng nhúng trong user.
  const addr1 = { recipientName: "Nguyễn Minh Anh", phone: "0901 234 567", street: "125 Nguyễn Huệ, Phường Bến Nghé, Quận 1", city: "Thành phố Hồ Chí Minh", isDefault: true };
  const addr2 = { recipientName: "Trần Quốc Bảo", phone: "0912 345 678", street: "18 Trần Duy Hưng, Cầu Giấy", city: "Hà Nội", isDefault: true };
  const [admin, seller1, seller2, buyer1, buyer2] = await User.create([
    { username: "admin", email: "admin@nova.vn", password: "123456", fullName: "Quản trị NOVA", role: "Admin" },
    { username: "novastore", email: "seller@nova.vn", password: "123456", fullName: "NOVA Store", phone: "0909 000 111", role: "Seller" },
    { username: "techzone", email: "techzone@nova.vn", password: "123456", fullName: "TechZone", phone: "0909 000 222", role: "Seller" },
    { username: "minhanh", email: "minhanh@example.com", password: "123456", fullName: "Nguyễn Minh Anh", phone: "0901 234 567", role: "Buyer", addresses: [addr1] },
    { username: "quocbao", email: "quocbao@example.com", password: "123456", fullName: "Trần Quốc Bảo", phone: "0912 345 678", role: "Buyer", addresses: [addr2] },
  ]);
  await User.create({ username: "hoangnam", email: "hoangnam@example.com", password: "123456", fullName: "Lê Hoàng Nam", role: "Buyer", status: "Locked" });

  const shops = await Shop.create([
    {
      seller: seller1._id,
      shopName: "NOVA Store",
      description: "Cửa hàng công nghệ chính hãng của NOVA",
      status: "Approved",
      reviewedAt: new Date(),
      addresses: [
        { label: "Chi nhánh Quận 1", phone: "0909 000 111", street: "12 Lê Lợi, Quận 1", city: "Thành phố Hồ Chí Minh" },
        { label: "Chi nhánh Cầu Giấy", phone: "0909 000 112", street: "88 Xuân Thủy, Cầu Giấy", city: "Hà Nội" },
      ],
    },
    {
      seller: seller2._id,
      shopName: "TechZone",
      description: "Chuyên linh kiện PC và gaming gear",
      status: "Approved",
      reviewedAt: new Date(),
      addresses: [{ label: "Kho chính", phone: "0909 000 222", street: "45 Nguyễn Văn Linh, Hải Châu", city: "Đà Nẵng" }],
    },
  ]);
  // Một yêu cầu "Trở thành đối tác" đang chờ admin duyệt
  await Shop.create({
    seller: buyer2._id,
    shopName: "Bảo Gear",
    description: "Phụ kiện gaming giá tốt",
    addresses: [{ label: "Cửa hàng", phone: "0912 345 678", street: "18 Trần Duy Hưng, Cầu Giấy", city: "Hà Nội" }],
  });

  const toDoc = ([productName, brand, category, price, oldPrice, stock, image, specs, shop], approvalStatus) => {
    // Ảnh phụ: lấy ảnh của sản phẩm cùng danh mục để có bộ sưu tập
    const extra = PRODUCTS.filter((p) => p[2] === category && p[6] !== image).map((p) => p[6]);
    return {
      shop: shops[shop]._id,
      category: catId[category],
      productName,
      brand,
      price,
      oldPrice,
      stock,
      approvalStatus,
      description: `${productName} chính hãng, thiết kế hiện đại, hiệu năng ổn định và chính sách hỗ trợ minh bạch, phù hợp cho nhu cầu làm việc, học tập và giải trí hằng ngày.`,
      images: [image, ...extra].slice(0, 3).map((id, i) => ({ imageUrl: img(id), isThumbnail: i === 0 })),
      specifications: specs.map(([attributeName, attributeValue]) => ({ attributeName, attributeValue })),
    };
  };
  const products = await Product.insertMany(PRODUCTS.map((p) => toDoc(p, "Approved")));
  await Product.insertMany(PENDING.map((p) => toDoc(p, "Pending")));

  // Đơn hàng đã giao + đánh giá cho mỗi sản phẩm
  const buyers = [buyer1, buyer2];
  const addresses = [addr1, addr2];
  let n = 0;
  for (const product of products) {
    for (const [bi, buyer] of buyers.entries()) {
      const [rating, comment] = REVIEW_TEXTS[(n + bi) % REVIEW_TEXTS.length];
      const { recipientName, phone, street, city } = addresses[bi];
      const order = await Order.create({
        code: `NOVA${String(240000 + n * 2 + bi)}`,
        buyer: buyer._id,
        shop: product.shop,
        orderDate: new Date(Date.now() - (30 - n) * 86400000),
        totalAmount: product.price,
        orderStatus: "Delivered",
        shippingAddress: { recipientName, phone, street, city },
        items: [{ product: product._id, productName: product.productName, image: product.images[0].imageUrl, quantity: 1, unitPrice: product.price }],
      });
      await Payment.create({ order: order._id, paymentMethod: bi ? "VNPay" : "COD", paymentStatus: "Paid", amount: product.price, paidAt: order.orderDate });
      await Review.create({ buyer: buyer._id, shop: product.shop, product: product._id, rating, comment });
    }
    const reviews = await Review.find({ product: product._id });
    product.rating = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
    product.reviewCount = reviews.length;
    product.sold = 2 + ((n * 7) % 13);
    await product.save();
    n++;
  }

  // Một đơn đang chờ xác nhận để seller thử xử lý
  const p0 = products[0];
  const pending = await Order.create({
    code: "NOVA250001",
    buyer: buyer1._id,
    shop: p0.shop,
    totalAmount: p0.price,
    shippingAddress: { recipientName: addr1.recipientName, phone: addr1.phone, street: addr1.street, city: addr1.city },
    items: [{ product: p0._id, productName: p0.productName, image: p0.images[0].imageUrl, quantity: 1, unitPrice: p0.price }],
  });
  await Payment.create({ order: pending._id, paymentMethod: "COD", amount: p0.price });

  console.log(`Seed xong: ${categories.length} danh mục, ${products.length + PENDING.length} sản phẩm, admin=${admin.username}`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
