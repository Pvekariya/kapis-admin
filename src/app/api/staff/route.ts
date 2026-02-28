import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

/* GET ALL */
export async function GET() {
  const db = await getDb();

  const staff = await db
    .collection("staff")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(staff);
}

/* ADD STAFF */
export async function POST(req: Request) {
  const db = await getDb();
  const body = await req.json();

  const newStaff = {
    name: body.name,
    phone: body.phone,
    role: body.role,
    monthlySalary: Number(body.monthlySalary),
    joiningDate: new Date(),
    status: "active",
    advanceBalance: 0,
    createdAt: new Date(),
  };

  await db.collection("staff").insertOne(newStaff);

  return NextResponse.json({ success: true });
}

/* UPDATE STAFF */
export async function PUT(req: Request) {
  const db = await getDb();
  const body = await req.json();

  await db.collection("staff").updateOne(
    { _id: new ObjectId(body.id) },
    {
      $set: {
        name: body.name,
        phone: body.phone,
        role: body.role,
        monthlySalary: Number(body.monthlySalary),
        status: body.status,
      },
    }
  );

  return NextResponse.json({ success: true });
}

/* DELETE STAFF */
export async function DELETE(req: Request) {
  const db = await getDb();
  const { id } = await req.json();

  await db.collection("staff").deleteOne({
    _id: new ObjectId(id),
  });

  return NextResponse.json({ success: true });
}