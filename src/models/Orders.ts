import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  productId: String,
  productName: String,
  qty: Number,
  dealer: String,

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },

  status: {
    type: String,
    enum: ["waiting", "processing", "ready"],
    default: "waiting",
  },

  date: { type: Date, default: Date.now },
});

export default mongoose.models.Orders ||
  mongoose.model("Orders", OrderSchema);