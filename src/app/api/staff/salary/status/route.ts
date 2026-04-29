import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  try {
    const { searchParams } = new URL(req.url);
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (!month || !year) {
      return NextResponse.json({ error: "Invalid month/year" }, { status: 400 });
    }

    const db = await getDb();
    const lockedCount = await db.collection("salaryLocks").countDocuments({
      month,
      year,
      isLocked: true,
    });

    return NextResponse.json({ locked: lockedCount > 0, lockedCount });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
