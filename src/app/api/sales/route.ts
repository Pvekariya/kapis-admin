import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const db = await getDb();

  const data = await db
    .collection("sales")
    .find({})
    .sort({ date: -1 })
    .toArray();

  return NextResponse.json(data);
}