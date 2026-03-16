import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email().max(200).optional(),
  // avatar is a URL string or base64 — keep max size reasonable
  avatar: z.string().max(500_000).optional(),
});

export async function POST(req: Request) {
  try {
    const payload = await requireAuth();

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data" },
        { status: 400 }
      );
    }

    const { name, email, avatar } = parsed.data;

    const updateFields: Record<string, string> = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email.toLowerCase();
    if (avatar !== undefined) updateFields.avatar = avatar;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ success: true }); // nothing to update
    }

    const db = await getDb();

    await db.collection("users").updateOne(
      { _id: new ObjectId(payload.userId) },
      { $set: updateFields }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    if (message === "No session" || message === "Invalid session") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}