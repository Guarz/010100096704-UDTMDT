import mongoose from "mongoose";

// Địa chỉ cửa hàng / kho lấy hàng, nhúng trong SHOP (1 shop có thể có nhiều địa chỉ)
const shopAddressSchema = new mongoose.Schema({
  label: { type: String, trim: true, default: "" },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
});

// SHOP: mỗi user có tối đa 1 shop. Shop được tạo khi user gửi yêu cầu "Trở thành đối tác"
// (status Pending); admin duyệt -> Approved và user được nâng thành Seller.
const shopSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    shopName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    addresses: [shopAddressSchema],
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
    rejectReason: { type: String, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Shop", shopSchema);
