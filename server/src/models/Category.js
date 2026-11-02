import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "box" },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
