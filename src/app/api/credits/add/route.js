// app/api/credits/add/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";

export async function POST(req) {
  try {
    const db = await dbConnect();
    const user = await getUserFromRequest(req, db);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { amount } = await req.json();
    const creditsToAdd = Number(amount || 0);

    if (!creditsToAdd || creditsToAdd <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const users = db.collection("users");

    // mongodb v6: findOneAndUpdate returns the *document*, not { value: doc }
    const updatedUser = await users.findOneAndUpdate(
      { _id: user._id },
      { $inc: { credits: creditsToAdd } },
      { returnDocument: "after" }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { credits: updatedUser.credits },
      { status: 200 }
    );
  } catch (err) {
    console.error("CREDITS ADD ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
