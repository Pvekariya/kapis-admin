import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const StaffSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional().default(""),
  role: z.string().max(100).optional().default(""),
  monthlySalary: z.number().min(0),
});

export async function GET() {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const db = await getDb();
  const staff = await db
    .collection("staff")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(staff);
}

export async function POST(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = StaffSchema.safeParse({
    ...body,
    monthlySalary: Number(body.monthlySalary ?? 0),
  });
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const db = await getDb();
  await db.collection("staff").insertOne({
    ...parsed.data,
    joiningDate: new Date(),
    status: "active",
    advanceBalance: 0,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const body = await req.json();
  if (!body.id)
    return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const parsed = StaffSchema.safeParse({
    ...body,
    monthlySalary: Number(body.monthlySalary ?? 0),
  });
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const db = await getDb();
  await db.collection("staff").updateOne(
    { _id: new ObjectId(body.id) },
    { $set: { ...parsed.data, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const unauth = await guardAuth();
  if (unauth) return unauth;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = await getDb();
  await db.collection("staff").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
}