import { NextResponse } from "next/server";

export async function POST(req) {
  const token = req.cookies.get("token")?.value;

  // ❌ No token → user is not logged in
  if (!token) {
    return NextResponse.json(
      { error: "You are not logged in" },
      { status: 401 }
    );
  }

  // ✅ Token exists → clear it
  const res = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  res.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // delete cookie
  });

  return res;
}
