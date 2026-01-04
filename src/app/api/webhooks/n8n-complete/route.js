import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Log raw body first (debug)
    const rawBody = await req.text();
    console.log("n8n raw callback body:", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error("n8n callback parse error:", parseErr.message, "Raw body:", rawBody);
      return NextResponse.json({ error: "Invalid JSON from n8n", raw: rawBody }, { status: 400 });
    }

    console.log("n8n parsed callback:", body);

    const { jobId, videourl } = body; // or videoUrl, videourl, etc.

    if (!jobId || !ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    const db = await dbConnect();
    const jobsCol = db.collection("ad_jobs");

    const update = {
      status: videourl ? "completed" : "failed",
      videoUrl: videourl || null,
      error: videourl ? null : "No video URL provided by n8n",
      updatedAt: new Date(),
    };

    const result = await jobsCol.updateOne(
      { _id: new ObjectId(jobId) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      console.warn("Job not found:", jobId);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    console.log("Job updated successfully:", jobId, update.status);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("n8n callback error:", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}