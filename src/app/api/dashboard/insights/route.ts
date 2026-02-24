import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const db = await getDb();

  const threshold = 500;

  const inventory = await db.collection("inventory").find().toArray();
  const leads = await db.collection("leads").find().toArray();
  const orders = await db.collection("orders").find().toArray();

  /* ---------- LOW STOCK ---------- */

  const lowStock = inventory
    .filter((p: any) => Number(p.stock) <= threshold)
    .map((p: any) => ({
      productId: p._id,
      product: p.name,
      color: p.color || "",
      stock: p.stock,
      buyer: "Inventory",
    }));

  /* ---------- ORDERS ---------- */

  const formattedOrders = orders.map((o: any) => ({
    _id: o._id,
    buyer: o.source === "bill"
      ? o.buyer || "Unknown Customer"
      : "Inventory",

    product: o.product || o.name || o.title || o.item || "Unknown",
    color: o.color || "",

    qty: o.qty,
    status: o.status || "pending",
    priority: o.priority || "normal",
    createdAt: new Date(o.createdAt).toLocaleString(),
  }));

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const newLeads = leads.filter((l: any) => {
    const d = new Date(l.date || l.createdAt);
    return d >= start && d <= end;
  });

  return NextResponse.json({
    lowStock,
    deadStock: [],
    newLeads,
    orders: formattedOrders,
  });
}