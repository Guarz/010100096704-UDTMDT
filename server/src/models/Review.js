import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// Mỗi người mua đánh giá 1 sản phẩm 1 lần
reviewSchema.index({ buyer: 1, product: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
