import mongoose from "mongoose";

// PRODUCT_IMAGE và PRODUCT_SPECIFICATION được nhúng (embedded) trong PRODUCT
const imageSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  isThumbnail: { type: Boolean, default: false },
});

const specSchema = new mongoose.Schema({
  attributeName: { type: String, required: true, trim: true },
  attributeValue: { type: String, required: true, trim: true },
});

const productSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    productName: { type: String, required: true, trim: true },
    brand: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    approvalStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
    images: [imageSchema],
    specifications: [specSchema],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
