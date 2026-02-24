import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const db = await getDb();

  const leads = await db
    .collection("leads")
    .find({})
    .sort({ date: -1 })
    .toArray();

  return NextResponse.json(leads);
}

export async function PATCH(req: Request) {
  const { id, status } = await req.json();

  const db = await getDb();

  await db.collection("leads").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const db = await getDb();
  const body = await req.json();

  await db.collection("leads").insertOne({
    ...body,
    date: new Date(),
  });

  // 🔔 notification
  await db.collection("notifications").insertOne({
    message: `New lead: ${body.name || "Unknown"}`,
    type: "lead",
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}