// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import { ObjectId } from "mongodb";

// export const dynamic = 'force-dynamic';

// export async function POST(req) {
//   try {
//     // Log raw body first (debug)
//     const rawBody = await req.text();
//     console.log("n8n raw callback body:", rawBody);

//     let body;
//     try {
//       body = JSON.parse(rawBody);
//     } catch (parseErr) {
//       console.error("n8n callback parse error:", parseErr.message, "Raw body:", rawBody);
//       return NextResponse.json({ error: "Invalid JSON from n8n", raw: rawBody }, { status: 400 });
//     }

//     console.log("n8n parsed callback:", body);

//     const { jobId, videourl } = body; // or videoUrl, videourl, etc.

//     if (!jobId || !ObjectId.isValid(jobId)) {
//       return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
//     }

//     const db = await dbConnect();
//     const jobsCol = db.collection("ad_jobs");

//     const update = {
//       status: videourl ? "completed" : "failed",
//       videoUrl: videourl || null,
//       error: videourl ? null : "No video URL provided by n8n",
//       updatedAt: new Date(),
//     };

//     const result = await jobsCol.updateOne(
//       { _id: new ObjectId(jobId) },
//       { $set: update }
//     );

//     if (result.matchedCount === 0) {
//       console.warn("Job not found:", jobId);
//       return NextResponse.json({ error: "Job not found" }, { status: 404 });
//     }

//     console.log("Job updated successfully:", jobId, update.status);
//     return NextResponse.json({ success: true }, { status: 200 });
//   } catch (err) {
//     console.error("n8n callback error:", err.message);
//     return NextResponse.json({ error: "Internal error" }, { status: 500 });
//   }
// }



// src/app/api/webhooks/n8n-complete/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Log raw body first for debugging
    const rawBody = await req.text();
    console.log("n8n callback RAW body:", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody || '{}');
    } catch (parseErr) {
      console.error("n8n callback JSON parse error:", parseErr.message, "Raw:", rawBody);
      // Still try to update as failed
      body = { error: "Invalid JSON from n8n" };
    }

    console.log("n8n callback parsed:", body);

    const { jobId, videourl, videoUrl, url } = body; // support multiple possible keys

    if (!jobId || !ObjectId.isValid(jobId)) {
      console.warn("Invalid jobId in callback:", jobId);
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    const db = await dbConnect();
    const jobsCol = db.collection("ad_jobs");

    const finalUrl = videourl || videoUrl || url || null;

    const update = {
      status: finalUrl ? "completed" : "failed",
      videoUrl: finalUrl,
      error: finalUrl ? null : "No video URL provided by n8n (check n8n output)",
      updatedAt: new Date(),
    };

    const result = await jobsCol.updateOne(
      { _id: new ObjectId(jobId) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      console.warn("Job not found in callback:", jobId);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    console.log("Job updated by n8n callback:", update.status, jobId, finalUrl);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("n8n callback fatal error:", err.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}