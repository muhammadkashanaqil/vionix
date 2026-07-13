// src/app/api/ads/[jobId]/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
  try {
    const params = await context.params;
    const { jobId } = params;

    const db = await dbConnect();
    const user = await getUserFromRequest(req, db);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!jobId || !ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    const jobsCol = db.collection("ad_jobs");
    const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId?.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      {
        jobId: job._id.toString(),
        prompt: job.prompt,
        status: job.status,
        videoUrl: job.videoUrl,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("JOB GET ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}