// // app/api/webhooks/n8n-ad-complete/route.js
// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import { ObjectId } from "mongodb";

// export async function POST(req) {
//   try {
//     const db = await dbConnect();
//     const projectsCol = db.collection("projects");

//     const body = await req.json();

//     const {
//       projectId,
//       status,          // "completed" | "failed"
//       resultVideoUrl,
//       resultImageUrl,
//       error,
//     } = body;

//     if (!projectId) {
//       return NextResponse.json(
//         { error: "projectId is required" },
//         { status: 400 }
//       );
//     }

//     const update = {
//       updatedAt: new Date(),
//     };

//     if (status) update.status = status;
//     if (resultVideoUrl) update.resultVideoUrl = resultVideoUrl;
//     if (resultImageUrl) update.resultImageUrl = resultImageUrl;
//     if (error && !status) update.status = "failed";

//     await projectsCol.updateOne(
//       { _id: new ObjectId(projectId) },
//       { $set: update }
//     );

//     return NextResponse.json({ ok: true }, { status: 200 });
//   } catch (err) {
//     console.error("N8N WEBHOOK ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }


// src/app/api/webhooks/n8n-complete/route.js
// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import { ObjectId } from "mongodb";

// export const dynamic = 'force-dynamic';

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     console.log("N8N CALLBACK RECEIVED:", body);

//     const { jobId, videoUrl, error } = body;

//     if (!jobId || !ObjectId.isValid(jobId)) {
//       return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
//     }

//     const db = await dbConnect();
//     const jobsCol = db.collection("ad_jobs");

//     const update = {
//       updatedAt: new Date(),
//     };

//     if (videoUrl) {
//       update.status = "completed";
//       update.videoUrl = videoUrl;
//     } else if (error) {
//       update.status = "failed";
//       update.error = String(error);
//     } else {
//       update.status = "failed";
//       update.error = "No video URL or error provided by n8n";
//     }

//     const result = await jobsCol.updateOne(
//       { _id: new ObjectId(jobId) },
//       { $set: update }
//     );

//     if (result.matchedCount === 0) {
//       console.warn(`Job ${jobId} not found for update`);
//       return NextResponse.json({ error: "Job not found" }, { status: 404 });
//     }

//     console.log(`Job ${jobId} updated to ${update.status}`);
//     return NextResponse.json({ success: true }, { status: 200 });

//   } catch (err) {
//     console.error("N8N CALLBACK ERROR:", err);
//     return NextResponse.json({ error: "Internal error" }, { status: 500 });
//   }
// }






// // src/app/api/webhooks/n8n-complete/route.js
// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import { ObjectId } from "mongodb";

// export const dynamic = 'force-dynamic';

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     console.log("n8n callback received:", body);

//     const { jobId, videoUrl } = body;

//     if (!jobId || !ObjectId.isValid(jobId)) {
//       return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
//     }

//     const db = await dbConnect();
//     const jobsCol = db.collection("ad_jobs");

//     const update = {
//       status: videoUrl ? "completed" : "failed",
//       videoUrl: videoUrl || null,
//       error: videoUrl ? null : "No video URL provided by n8n",
//       updatedAt: new Date(),
//     };

//     const result = await jobsCol.updateOne(
//       { _id: new ObjectId(jobId) },
//       { $set: update }
//     );

//     if (result.matchedCount === 0) {
//       console.warn("Job not found for callback update:", jobId);
//       return NextResponse.json({ error: "Job not found" }, { status: 404 });
//     }

//     console.log("Job updated by n8n callback:", update.status, jobId);
//     return NextResponse.json({ success: true }, { status: 200 });
//   } catch (err) {
//     console.error("n8n callback error:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }





// src/app/api/webhooks/n8n-complete/route.js
// src/app/api/webhooks/n8n-complete/route.js
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