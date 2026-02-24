import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema(
  {
    name: String,
    stock: Number,
    price: Number,
    hsn: String,
    color: String,
    type: String,
    packing: String,
  },
  {
    timestamps: true, // ✅ THIS FIXES ERROR
  }
);

export default mongoose.models.Inventory ||
  mongoose.model("Inventory", InventorySchema);