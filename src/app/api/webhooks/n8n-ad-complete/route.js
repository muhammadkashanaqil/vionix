// app/api/webhooks/n8n-ad-complete/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const db = await dbConnect();
    const projectsCol = db.collection("projects");

    const body = await req.json();

    const {
      projectId,
      status,          // "completed" | "failed"
      resultVideoUrl,
      resultImageUrl,
      error,
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const update = {
      updatedAt: new Date(),
    };

    if (status) update.status = status;
    if (resultVideoUrl) update.resultVideoUrl = resultVideoUrl;
    if (resultImageUrl) update.resultImageUrl = resultImageUrl;
    if (error && !status) update.status = "failed";

    await projectsCol.updateOne(
      { _id: new ObjectId(projectId) },
      { $set: update }
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("N8N WEBHOOK ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
