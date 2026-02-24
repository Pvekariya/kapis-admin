import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/session=([^;]+)/);

    console.log("COOKIE:", cookie);
    console.log("SESSION MATCH:", match);

    if (!match) {
      return NextResponse.json({
        success: false,
        error: "No session cookie",
      });
    }

    const userId = match[1];
    const body = await req.json();

    console.log("UPDATE BODY:", body);
    console.log("USER ID:", userId);

    const db = await getDb();

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          email: body.email,
          avatar: body.avatar,
          name: body.name,
        },
      }
    );

    console.log("MONGO RESULT:", result);

    return NextResponse.json({
      success: true, // ← force success for now
    });

  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);

    return NextResponse.json({
      success: false,
      error: "Server crash",
    });
  }
}