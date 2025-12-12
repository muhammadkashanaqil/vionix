// app/api/credits/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";

export async function GET(req) {
  try {
    const db = await dbConnect();
    const user = await getUserFromRequest(req, db);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { credits: user.credits ?? 0 },
      { status: 200 }
    );
  } catch (err) {
    console.error("CREDITS GET ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
