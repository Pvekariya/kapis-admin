import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password === process.env.ADMIN_PASSWORD) {
    const res = NextResponse.json({ success: true });

    res.cookies.set("admin", "true", {
      httpOnly: true,
      secure: false,
      path: "/",
    });

    return res;
  }

  return NextResponse.json(
    { error: "Wrong password" },
    { status: 401 }
  );
}