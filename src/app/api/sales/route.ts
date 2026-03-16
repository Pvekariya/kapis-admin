import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";

export async function GET() {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const data = await db
    .collection("sales")
    .find({})
    .sort({ date: -1 })
    .toArray();

  return NextResponse.json(data);
}