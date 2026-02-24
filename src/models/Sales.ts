import mongoose from "mongoose";

const SalesSchema = new mongoose.Schema({
  productId: String,
  name: String,
  qty: Number,
  price: Number,
  total: Number,
  date: { type: Date, default: Date.now },
});

export default mongoose.models.Sales ||
  mongoose.model("Sales", SalesSchema);