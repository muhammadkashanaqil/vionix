// app/api/projects/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

const AD_COST = 15; // credits per generated ad

// GET /api/projects -> list current user's projects
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

    const projectsCol = db.collection("projects");

    const projects = await projectsCol
      .find({ userId: new ObjectId(user._id) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(projects, { status: 200 });
  } catch (err) {
    console.error("PROJECTS GET ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects -> create a project and trigger n8n
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

    const { title, prompt, productImageUrl } = await req.json();

    if (!prompt || !productImageUrl) {
      return NextResponse.json(
        { error: "prompt and productImageUrl are required" },
        { status: 400 }
      );
    }

    const usersCol = db.collection("users");

    // 🔒 atomic credit deduction to avoid race conditions
    const updatedUser = await usersCol.findOneAndUpdate(
      { _id: user._id, credits: { $gte: AD_COST } },
      { $inc: { credits: -AD_COST } },
      { returnDocument: "after" }
    );

    // depending on driver version, updatedUser is either the doc or null
    if (!updatedUser) {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 402 }
      );
    }

    const projectsCol = db.collection("projects");

    const now = new Date();
    const projectDoc = {
      userId: new ObjectId(user._id),
      title: title || "New Ad",
      prompt,
      productImageUrl,
      resultVideoUrl: null,
      resultImageUrl: null,
      status: "generating",
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await projectsCol.insertOne(projectDoc);
    const projectId = insertResult.insertedId;

    // 🔁 call n8n webhook
    try {
      const webhookUrl = process.env.N8N_WEBHOOK_URL;
      const callbackBase = process.env.APP_BASE_URL; // e.g. https://your-domain.com

      if (!webhookUrl || !callbackBase) {
        console.warn("N8N_WEBHOOK_URL or APP_BASE_URL not set");
      } else {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: projectId.toString(),
            userId: user._id.toString(),
            prompt,
            productImageUrl,
            callbackUrl: `${callbackBase}/api/webhooks/n8n-ad-complete`,
          }),
        });
      }
    } catch (e) {
      console.error("Error calling n8n webhook:", e);
      // optional: mark as failed or refund credits
    }

    return NextResponse.json(
      {
        projectId,
        status: "generating",
        remainingCredits: updatedUser.credits ?? 0,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("PROJECTS POST ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
