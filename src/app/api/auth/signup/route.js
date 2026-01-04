
// import { dbConnect } from "@/app/lib/mongodb";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { NextResponse } from "next/server";

// export async function POST(req) {
//   try {
//     const { name, email, password } = await req.json();

//     if (!name || !email || !password) {
//       return NextResponse.json({ error: "Missing fields" }, { status: 400 });
//     }

//     const db = await dbConnect();
//     const users = db.collection("users");

//     const exists = await users.findOne({ email });
//     if (exists) {
//       return NextResponse.json({ error: "User already exists" }, { status: 409 });
//     }

//     const hashed = await bcrypt.hash(password, 10);

//     const result = await users.insertOne({
//       name,
//       email,
//       password: hashed,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     const token = jwt.sign(
//       { id: result.insertedId, email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     const res = NextResponse.json({
//       message: "Signup successful",
//       user: { id: result.insertedId, name, email }
//     });

//     res.cookies.set("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       path: "/",
//       maxAge: 60 * 60 * 24 * 7,
//     });

//     return res;
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// app/api/auth/signup/route.js
// import { dbConnect } from "@/app/lib/mongodb";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { NextResponse } from "next/server";

// export async function POST(req) {
//   try {
//     const { name, email, password } = await req.json();

//     if (!name || !email || !password) {
//       return NextResponse.json({ error: "Missing fields" }, { status: 400 });
//     }

//     const db = await dbConnect();
//     const users = db.collection("users");

//     const exists = await users.findOne({ email });
//     if (exists) {
//       return NextResponse.json(
//         { error: "User already exists" },
//         { status: 409 }
//       );
//     }

//     const hashed = await bcrypt.hash(password, 10);

//     const result = await users.insertOne({
//       name,
//       email,
//       password: hashed,
//       credits: 0,                 // <-- important for your app
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     const token = jwt.sign(
//       { id: result.insertedId, email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     const res = NextResponse.json({
//       message: "Signup successful",
//       user: { id: result.insertedId, name, email },
//     });

//     res.cookies.set("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       path: "/",
//       maxAge: 60 * 60 * 24 * 7,
//     });

//     return res;
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }


import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

const AD_COST = 15;

function unwrapDoc(result) {
  if (!result) return null;
  return result.value ?? result;
}

export async function POST(req) {
  try {
    const db = await dbConnect();
    const user = await getUserFromRequest(req, db);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { prompt, imageKey, imageUrl } = await req.json();

    if (!prompt || !imageKey || !imageUrl) {
      return NextResponse.json(
        { error: "prompt, imageKey, imageUrl are required" },
        { status: 400 }
      );
    }

    const usersCol = db.collection("users");
    const jobsCol = db.collection("ad_jobs");

    // ✅ Ensure ObjectId
    const userId = new ObjectId(user._id);

    // ✅ Atomic credit deduction
    const creditResult = await usersCol.findOneAndUpdate(
      { _id: userId, credits: { $gte: AD_COST } },
      { $inc: { credits: -AD_COST } },
      { returnDocument: "after" }
    );

    const updatedUser = unwrapDoc(creditResult);

    if (!updatedUser) {
      return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
    }

    // ✅ Create job
    const now = new Date();
    const jobDoc = {
      userId,
      prompt,
      imageKey,
      imageUrl,
      status: "queued",
      creditCost: AD_COST,
      videoUrl: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await jobsCol.insertOne(jobDoc);
    const jobId = insertResult.insertedId.toString();

    // ✅ Trigger n8n (THIS is what you were missing)
    try {
      const webhookUrl = process.env.N8N_WEBHOOK_URL;      // n8n "start" webhook
      const callbackBase = process.env.APP_BASE_URL;       // http://localhost:3000 OR https://yourdomain
      const secret = process.env.N8N_WEBHOOK_SECRET;

      if (!webhookUrl || !callbackBase || !secret) {
        console.warn("Missing N8N_WEBHOOK_URL / APP_BASE_URL / N8N_WEBHOOK_SECRET");
      } else {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            userId: userId.toString(),
            prompt,
            imageUrl,
            imageKey,
            callbackUrl: `${callbackBase}/api/webhooks/n8n`,
            secret,
          }),
        });
      }
    } catch (e) {
      console.error("Error calling n8n webhook:", e);

      // Optional: mark job failed (or refund credits if you want)
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            status: "failed",
            error: "Failed to trigger n8n workflow",
            updatedAt: new Date(),
          },
        }
      );
    }

    return NextResponse.json(
      {
        jobId,
        status: "queued",
        creditsRemaining: updatedUser.credits ?? 0,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("ADS CREATE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
