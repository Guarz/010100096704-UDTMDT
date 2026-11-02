import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ADDRESS nhúng trong USER: sổ địa chỉ giao hàng luôn đọc/ghi cùng người dùng
const addressSchema = new mongoose.Schema({
  recipientName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false },
});

// USER: Role Buyer/Seller/Admin, Status Active/Locked
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    birthday: { type: Date },
    role: { type: String, enum: ["Buyer", "Seller", "Admin"], default: "Buyer" },
    status: { type: String, enum: ["Active", "Locked"], default: "Active" },
    addresses: [addressSchema],
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
