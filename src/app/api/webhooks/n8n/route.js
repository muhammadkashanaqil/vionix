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
// import { NextResponse } from "next/server";
// import { ObjectId } from "mongodb";
// import { dbConnect } from "@/app/lib/mongodb";

// export const dynamic = 'force-dynamic';

// export async function POST(req) {
//   try {
//     const db = await dbConnect();
//     const jobsCol = db.collection("ad_jobs");

//     // Read the text body first to avoid JSON parsing crashes
//     const rawText = await req.text();
//     console.log("👉 RAW N8N WEBHOOK BODY:", rawText);

//     let body = {};
//     try {
//       body = JSON.parse(rawText || "{}");
//     } catch (e) {
//       console.error("❌ Failed to parse JSON from n8n:", e.message);
//     }

//     // Capture every possible variant of jobId
//     const jobId =
//       body.jobId ||
//       body.jobID ||
//       body.id ||
//       body.data?.jobId ||
//       body.data?.jobID;

//     // Capture every possible variant of video link
//     const videoUrl =
//       body.videoUrl ||
//       body.videoURL ||
//       body.response || 
//       body.resultVideoUrl ||
//       body.resultUrl ||
//       body.url ||
//       body.data?.videoUrl ||
//       body.data?.response || 
//       body.data?.url;

//     const secret = body.secret || body.webhookSecret || body.data?.secret;

//     // Optional Security Check (Will skip if environment variable isn't set)
//     const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
//     if (expectedSecret && secret !== expectedSecret) {
//       console.log("❌ WEBHOOK UNAUTHORIZED (Secret Mismatch)");
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     if (!jobId || !ObjectId.isValid(jobId)) {
//       console.log("❌ WEBHOOK ABORTED: Missing or invalid jobId format:", jobId);
//       return NextResponse.json({ error: "Invalid or missing jobId" }, { status: 400 });
//     }

//     // Force "completed" if we found any video link, otherwise fall back to status provided
//     const status = videoUrl ? "completed" : (body.status || "failed");
//     const errorMsg = body.error || body.message || "";

//     const updateData = {
//       status: status,
//       videoUrl: videoUrl || "",
//       error: errorMsg,
//       updatedAt: new Date(),
//     };

//     const result = await jobsCol.updateOne(
//       { _id: new ObjectId(jobId) },
//       { $set: updateData }
//     );

//     console.log("✅ DATABASE UPDATED SUCCESSFULLY:", {
//       matched: result.matchedCount,
//       modified: result.modifiedCount,
//       dataStored: updateData
//     });

//     return NextResponse.json({ success: true, ok: true }, { status: 200 });

//   } catch (err) {
//     console.error("❌ CRITICAL WEBHOOK ERROR:", err);
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

    // Read the body safely
    const rawText = await req.text();
    console.log("👉 RAW N8N WEBHOOK BODY RECEIVED:", rawText);

    let body = {};
    try {
      body = JSON.parse(rawText || "{}");
    } catch (e) {
      console.error("❌ Failed to parse JSON from n8n callback:", e.message);
    }

    // Capture every possible variant of jobId
    const jobId =
      body.jobId ||
      body.jobID ||
      body.id ||
      body.data?.jobId ||
      body.data?.jobID;

    // Capture every possible variant of video link
    const videoUrl =
      body.videoUrl ||
      body.videoURL ||
      body.response || 
      body.resultVideoUrl ||
      body.resultUrl ||
      body.url ||
      body.data?.videoUrl ||
      body.data?.response || 
      body.data?.url;

    const secret = body.secret || body.webhookSecret || body.data?.secret;

    // Optional Security Check
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      console.log("❌ WEBHOOK UNAUTHORIZED (Secret Mismatch)");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!jobId || !ObjectId.isValid(jobId)) {
      console.log("❌ WEBHOOK ABORTED: Missing or invalid jobId format:", jobId);
      return NextResponse.json({ error: "Invalid or missing jobId" }, { status: 400 });
    }

    // Set status based on videoUrl presence
    const status = videoUrl ? "completed" : (body.status || "failed");
    const errorMsg = body.error || body.message || (videoUrl ? "" : "No video URL provided by n8n");

    const updateData = {
      status: status,
      videoUrl: videoUrl || "",
      error: errorMsg,
      updatedAt: new Date(),
    };

    const result = await jobsCol.updateOne(
      { _id: new ObjectId(jobId) },
      { $set: updateData }
    );

    console.log("✅ DATABASE UPDATED SUCCESSFULLY:", {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      dataStored: updateData
    });

    return NextResponse.json({ success: true, ok: true }, { status: 200 });

  } catch (err) {
    console.error("❌ CRITICAL WEBHOOK ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}