import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();

    // 🔥 IMPORTANT — use SAME collection name as POST route
    const data = await db
      .collection("purchase")
      .find({})
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Purchase Ledger Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch purchase ledger" },
      { status: 500 }
    );
  }
}