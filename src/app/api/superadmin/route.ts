import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { guardSuperAdmin } from "@/lib/auth";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { CreateTenantSchema, UpdateTenantSchema } from "@/lib/entitySchema";

/* GET — list all tenants */
export async function GET() {
  const unauth = await guardSuperAdmin();
  if (unauth) return unauth;

  const db      = await getDb();
  const tenants = await db
    .collection("tenants")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  // Count users per tenant
  const enriched = await Promise.all(tenants.map(async t => {
    const userCount = await db.collection("users").countDocuments({ tenantId: t._id.toString() });
    return { ...t, userCount };
  }));

  return NextResponse.json(enriched);
}

/* POST — create new tenant */
export async function POST(req: Request) {
  const unauth = await guardSuperAdmin();
  if (unauth) return unauth;

  const body   = await req.json();
  const parsed = CreateTenantSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const data = parsed.data;
  const db   = await getDb();

  /* Check slug uniqueness */
  const existing = await db.collection("tenants").findOne({ slug: data.slug });
  if (existing)
    return NextResponse.json({ error: "Slug already taken" }, { status: 400 });

  /* Create tenant */
  const tenant = await db.collection("tenants").insertOne({
    name:         data.name,
    slug:         data.slug,
    primaryColor: data.primaryColor,
    logoUrl:      data.logoUrl,
    invoiceHeader: data.invoiceHeader,
    plan:         "starter",
    active:       true,
    createdAt:    new Date(),
  });

  const tenantId = tenant.insertedId.toString();

  /* Create admin user for this tenant */
  const hashedPw = await bcrypt.hash(data.adminPassword, 12);
  await db.collection("users").insertOne({
    email:     data.adminEmail.toLowerCase(),
    password:  hashedPw,
    name:      `${data.name} Admin`,
    role:      "admin",
    tenantId,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, tenantId, slug: data.slug });
}

/* PATCH — update tenant settings */
export async function PATCH(req: Request) {
  const unauth = await guardSuperAdmin();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = UpdateTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id, ...update } = parsed.data;

  const db = await getDb();
  await db.collection("tenants").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...update, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}

/* DELETE — deactivate tenant */
export async function DELETE(req: Request) {
  const unauth = await guardSuperAdmin();
  if (unauth) return unauth;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = await getDb();
  await db.collection("tenants").updateOne(
    { _id: new ObjectId(id) },
    { $set: { active: false, deactivatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
