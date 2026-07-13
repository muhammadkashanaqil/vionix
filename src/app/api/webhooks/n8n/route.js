// import { NextResponse } from "next/server";
// import { ObjectId } from "mongodb";
// import { dbConnect } from "@/app/lib/mongodb";

// export async function POST(req) {
//   try {
//     const db = await dbConnect();
//     const jobsCol = db.collection("ad_jobs");

//     const body = await req.json().catch(() => ({}));

//     console.log("✅ N8N CALLBACK HIT:", body);

//     // Accept common key names from n8n
//     const jobId =
//       body.jobId ||
//       body.jobID ||
//       body.id ||
//       body.data?.jobId ||
//       body.data?.jobID;

//     const secret =
//       body.secret ||
//       body.webhookSecret ||
//       body.data?.secret;

//     const videoUrl =
//       body.videoUrl ||
//       body.videoURL ||
//       body.resultVideoUrl ||
//       body.resultUrl ||
//       body.url ||
//       body.data?.videoUrl ||
//       body.data?.resultVideoUrl ||
//       body.data?.url;

//     const status =
//       body.status ||
//       body.state ||
//       (videoUrl ? "completed" : "failed");

//     const error =
//       body.error ||
//       body.message ||
//       body.data?.error ||
//       null;

//     // ✅ verify secret (if you set it)
//     const expected = process.env.N8N_WEBHOOK_SECRET;
//     if (expected && secret !== expected) {
//       console.log("❌ SECRET MISMATCH:", { received: secret, expected });
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     if (!jobId || !ObjectId.isValid(jobId)) {
//       console.log("❌ INVALID jobId:", jobId);
//       return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
//     }

//     const update = {
//       status: status === "completed" ? "completed" : "failed",
//       updatedAt: new Date(),
//       ...(videoUrl ? { videoUrl } : {}),
//       ...(error ? { error: String(error) } : {}),
//     };

//     const result = await jobsCol.updateOne(
//       { _id: new ObjectId(jobId) },
//       { $set: update }
//     );

//     console.log("✅ JOB UPDATED:", result.modifiedCount, update);

//     return NextResponse.json({ ok: true }, { status: 200 });
//   } catch (err) {
//     console.error("❌ N8N WEBHOOK ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }



// src/app/api/webhooks/n8n/route.js
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { dbConnect } from "@/app/lib/mongodb";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const db = await dbConnect();
    const jobsCol = db.collection("ad_jobs");

    const body = await req.json().catch(() => ({}));

    console.log("✅ N8N CALLBACK HIT:", body);

    // Accept common key names from n8n
    const jobId =
      body.jobId ||
      body.jobID ||
      body.id ||
      body.data?.jobId ||
      body.data?.jobID;

    const secret =
      body.secret ||
      body.webhookSecret ||
      body.data?.secret;

    // Added body.response and body.data?.response to support your n8n output structure!
    const videoUrl =
      body.videoUrl ||
      body.videoURL ||
      body.response || // <--- Added
      body.resultVideoUrl ||
      body.resultUrl ||
      body.url ||
      body.data?.videoUrl ||
      body.data?.response || // <--- Added
      body.data?.resultVideoUrl ||
      body.data?.url;

    const status =
      body.status ||
      body.state ||
      (videoUrl ? "completed" : "failed");

    const error =
      body.error ||
      body.message ||
      body.data?.error ||
      null;

    // Verify secret (if you set it)
    const expected = process.env.N8N_WEBHOOK_SECRET;
    if (expected && secret !== expected) {
      console.log("❌ SECRET MISMATCH:", { received: secret, expected });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!jobId || !ObjectId.isValid(jobId)) {
      console.log("❌ INVALID jobId:", jobId);
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    const update = {
      status: status === "completed" ? "completed" : "failed",
      updatedAt: new Date(),
      videoUrl: videoUrl || "", // Make sure we store an empty string fallback instead of null
      ...(error ? { error: String(error) } : { error: "" }),
    };

    const result = await jobsCol.updateOne(
      { _id: new ObjectId(jobId) },
      { $set: update }
    );

    console.log("✅ JOB UPDATED:", result.modifiedCount, update);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("❌ N8N WEBHOOK ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}