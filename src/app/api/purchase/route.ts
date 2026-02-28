import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();

    const {
      invoice,
      supplier,
      items = [],
      paymentMode = "cash",
      productType = "raw",
    } = body;

    if (!invoice || !supplier) {
      return NextResponse.json(
        { success: false, error: "Invoice and Supplier required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided" },
        { status: 400 }
      );
    }

    const purchaseItems: any[] = [];

    for (const i of items) {
      const qty = Number(i.qty);
      const price = Number(i.price);
      if (qty <= 0 || price < 0) continue;

      let product: any = null;
      const productName = i.productName || i.name;

      // Try find existing product
      if (i.productId) {
        try {
          product = await db.collection("inventory").findOne({
            _id: new ObjectId(i.productId),
            type: productType,
          });
        } catch {}
      }

      if (!product && productName) {
        product = await db.collection("inventory").findOne({
          name: productName,
          type: productType,
        });
      }

      // Update stock
      if (product) {
        const newStock = Number(product.stock || 0) + qty;

        await db.collection("inventory").updateOne(
          { _id: product._id },
          { $set: { stock: newStock } }
        );
      }

      // Create if not exists
      if (!product && productName) {
        const newProduct = {
          name: productName,
          stock: qty,
          price,
          type: productType,
          createdAt: new Date(),
        };

        const result = await db.collection("inventory").insertOne(newProduct);
        product = { ...newProduct, _id: result.insertedId };
      }

      if (!product) continue;

      purchaseItems.push({
        productId: product._id,
        name: product.name,
        qty,
        price,
        total: qty * price,
      });
    }

    if (purchaseItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid purchase items" },
        { status: 400 }
      );
    }

    const total = purchaseItems.reduce((sum, item) => sum + item.total, 0);

    // ✅ SAVE PURCHASE LEDGER ENTRY
    const purchaseDoc = {
      invoice,
      supplier,
      items: purchaseItems,
      total: Number(total),
      paymentMode,
      productType,
      date: new Date(),
      createdAt: new Date(),
    };

    const purchaseResult = await db
      .collection("purchase")
      .insertOne(purchaseDoc);

    // ✅ INSERT DAYBOOK EXPENSE ENTRY
    await db.collection("daybook").insertOne({
      type: "expense",
      category: "purchase",
      referenceId: purchaseResult.insertedId,
      description: `Purchase Invoice #${invoice} - ${supplier}`,
      amount: Number(total),
      paymentMode,
      date: new Date(),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Purchase Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}