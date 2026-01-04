// import { NextResponse } from "next/server";
// import { ObjectId } from "mongodb";
// import { dbConnect } from "@/app/lib/mongodb";
// import { getUserFromRequest } from "@/app/lib/auth";

// export async function GET(req, { params }) {
//   try {
//     const db = await dbConnect();
//     const user = await getUserFromRequest(req, db);

//     if (!user) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     const { jobId } = params;
//     if (!ObjectId.isValid(jobId)) {
//       return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
//     }

//     const jobsCol = db.collection("ad_jobs");
//     const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

//     if (!job) {
//       return NextResponse.json({ error: "Job not found" }, { status: 404 });
//     }

//     // Ensure user can only access their job
//     if (job.userId.toString() !== user._id.toString()) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     return NextResponse.json(
//       {
//         jobId: job._id.toString(),
//         status: job.status,
//         videoUrl: job.videoUrl,
//         error: job.error,
//         createdAt: job.createdAt,
//         updatedAt: job.updatedAt,
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("JOB GET ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }



// import { NextResponse } from "next/server";
// import { ObjectId } from "mongodb";
// import { dbConnect } from "@/app/lib/mongodb";
// import { getUserFromRequest } from "@/app/lib/auth";

// export async function GET(req, context) {
//   try {
//     const db = await dbConnect();
//     const user = await getUserFromRequest(req, db);

//     if (!user) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     // ✅ Next.js (newer) requires awaiting params
//     const { jobId } = await context.params;

//     if (!jobId || !ObjectId.isValid(jobId)) {
//       return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
//     }

//     const jobsCol = db.collection("ad_jobs");
//     const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

//     if (!job) {
//       return NextResponse.json({ error: "Job not found" }, { status: 404 });
//     }

//     // ✅ userId in job is ObjectId
//     if (job.userId?.toString() !== user._id.toString()) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     return NextResponse.json(
//       {
//         jobId: job._id.toString(),
//         status: job.status,
//         videoUrl: job.videoUrl,
//         error: job.error,
//         createdAt: job.createdAt,
//         updatedAt: job.updatedAt,
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("JOB GET ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }


// src/app/api/ads/[jobId]/route.js
// src/app/api/ads/[jobId]/route.js













// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import { getUserFromRequest } from "@/app/lib/auth";
// import { ObjectId } from "mongodb";

// export const dynamic = 'force-dynamic';

// // GET - Get job details + retry trigger n8n if queued
// export async function GET(req, context) {
//   try {
//     // IMPORTANT: Await params (this fixes the Promise error)
//     const params = await context.params; // ← Add this line
//     const { jobId } = params;

//     const db = await dbConnect();
//     const user = await getUserFromRequest(req, db);

//     if (!user) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     if (!jobId || !ObjectId.isValid(jobId)) {
//       return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
//     }

//     const jobsCol = db.collection("ad_jobs");
//     let job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

//     if (!job) {
//       return NextResponse.json({ error: "Job not found" }, { status: 404 });
//     }

//     // Ownership check - only creator can see
//     if (job.userId?.toString() !== user._id.toString()) {
//       return NextResponse.json({ error: "Forbidden - You can only view your own jobs" }, { status: 403 });
//     }

//     // If job is still queued → retry trigger n8n (safe retry on each poll)
//     if (job.status === "queued") {
//       console.log(`Retry triggering n8n for queued job ${jobId} (from polling)`);

//       const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
//       if (n8nWebhookUrl) {
//         const form = new FormData();
//         form.append("prompt", job.prompt);
//         form.append("jobId", jobId.toString());
//         // If you stored image URL/key during create, add it here:
//         // form.append("imageUrl", job.imageUrl || "");

//         fetch(n8nWebhookUrl, {
//           method: "POST",
//           body: form,
//         })
//           .then(async (res) => {
//             const text = await res.text();
//             console.log("Retry n8n response:", { status: res.status, body: text });
//             if (!res.ok) {
//               await jobsCol.updateOne(
//                 { _id: new ObjectId(jobId) },
//                 { $set: { status: "failed", error: `Retry failed (${res.status}): ${text}` } }
//               );
//             }
//           })
//           .catch((err) => {
//             console.error("Retry n8n trigger network error:", err);
//           });
//       } else {
//         console.warn("N8N_WEBHOOK_URL not set - cannot retry");
//       }
//     }

//     // Return current job data
//     return NextResponse.json(
//       {
//         jobId: job._id.toString(),
//         prompt: job.prompt,
//         status: job.status,
//         videoUrl: job.videoUrl,
//         error: job.error,
//         creditCost: job.creditCost,
//         createdAt: job.createdAt,
//         updatedAt: job.updatedAt,
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("JOB GET ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// // Optional: DELETE handler (you can keep or remove)
// export async function DELETE(req, context) {
//   try {
//     const params = await context.params; // ← Also await here
//     const { jobId } = params;

//     const db = await dbConnect();
//     const user = await getUserFromRequest(req, db);

//     if (!user) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     if (!jobId || !ObjectId.isValid(jobId)) {
//       return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
//     }

//     const jobsCol = db.collection("ad_jobs");
//     const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

//     if (!job) {
//       return NextResponse.json({ error: "Job not found" }, { status: 404 });
//     }

//     if (job.userId?.toString() !== user._id.toString()) {
//       return NextResponse.json({ error: "Forbidden - You can only delete your own jobs" }, { status: 403 });
//     }

//     const deleteResult = await jobsCol.deleteOne({ _id: new ObjectId(jobId) });

//     if (deleteResult.deletedCount === 0) {
//       return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
//     }

//     return NextResponse.json({
//       message: "Job deleted successfully",
//       jobId,
//     }, { status: 200 });
//   } catch (err) {
//     console.error("JOB DELETE ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }





// // src/app/api/ads/[jobId]/route.js
// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import { getUserFromRequest } from "@/app/lib/auth";
// import { ObjectId } from "mongodb";

// export const dynamic = 'force-dynamic';

// // GET - Get job details + retry trigger n8n if queued
// export async function GET(req, context) {
//   try {
//     // IMPORTANT FIX: Await params (Next.js App Router requires this for dynamic routes)
//     const params = await context.params;
//     const { jobId } = params;

//     const db = await dbConnect();
//     const user = await getUserFromRequest(req, db);

//     if (!user) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     if (!jobId || !ObjectId.isValid(jobId)) {
//       return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
//     }

//     const jobsCol = db.collection("ad_jobs");
//     let job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

//     if (!job) {
//       return NextResponse.json({ error: "Job not found" }, { status: 404 });
//     }

//     // Ownership check - only creator can view
//     if (job.userId?.toString() !== user._id.toString()) {
//       return NextResponse.json({ error: "Forbidden - You can only view your own jobs" }, { status: 403 });
//     }

//     // If job is still queued → retry trigger n8n (safe retry on polling)
//     if (job.status === "queued") {
//       console.log(`Retry triggering n8n for queued job ${jobId} (from polling)`);

//       const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
//       if (n8nWebhookUrl) {
//         const form = new FormData();
//         form.append("prompt", job.prompt);
//         form.append("jobId", jobId.toString());
//         // If you stored image URL/key in job during create, add it here:
//         // form.append("imageUrl", job.imageUrl || "");

//         // Trigger but don't await - fire and forget
//         fetch(n8nWebhookUrl, {
//           method: "POST",
//           body: form,
//         })
//           .then(async (res) => {
//             const text = await res.text();
//             console.log("Retry n8n response:", {
//               status: res.status,
//               statusText: res.statusText,
//               bodyPreview: text.substring(0, 500) + (text.length > 500 ? "..." : ""),
//             });

//             if (!res.ok) {
//               await jobsCol.updateOne(
//                 { _id: new ObjectId(jobId) },
//                 { $set: { status: "failed", error: `Retry failed (${res.status}): ${text}` } }
//               );
//             }
//           })
//           .catch((err) => {
//             console.error("Retry n8n trigger network error:", err.message);
//           });
//       } else {
//         console.warn("N8N_WEBHOOK_URL not set - cannot retry");
//       }
//     }

//     // Return current job data
//     return NextResponse.json(
//       {
//         jobId: job._id.toString(),
//         prompt: job.prompt,
//         status: job.status,
//         videoUrl: job.videoUrl,
//         error: job.error,
//         creditCost: job.creditCost,
//         createdAt: job.createdAt,
//         updatedAt: job.updatedAt,
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("JOB GET ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// // Optional: DELETE handler (you can keep or remove)
// export async function DELETE(req, context) {
//   try {
//     // Also await params here
//     const params = await context.params;
//     const { jobId } = params;

//     const db = await dbConnect();
//     const user = await getUserFromRequest(req, db);

//     if (!user) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     if (!jobId || !ObjectId.isValid(jobId)) {
//       return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
//     }

//     const jobsCol = db.collection("ad_jobs");
//     const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

//     if (!job) {
//       return NextResponse.json({ error: "Job not found" }, { status: 404 });
//     }

//     if (job.userId?.toString() !== user._id.toString()) {
//       return NextResponse.json({ error: "Forbidden - You can only delete your own jobs" }, { status: 403 });
//     }

//     const deleteResult = await jobsCol.deleteOne({ _id: new ObjectId(jobId) });

//     if (deleteResult.deletedCount === 0) {
//       return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
//     }

//     return NextResponse.json({
//       message: "Job deleted successfully",
//       jobId,
//     }, { status: 200 });
//   } catch (err) {
//     console.error("JOB DELETE ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }




// // src/app/api/ads/[jobId]/route.js
// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import { getUserFromRequest } from "@/app/lib/auth";
// import { ObjectId } from "mongodb";

// export const dynamic = 'force-dynamic';

// // GET - Get job details + retry trigger n8n if queued
// export async function GET(req, context) {
//   try {
//     // Await params to fix the Promise error
//     const params = await context.params;
//     const { jobId } = params;

//     const db = await dbConnect();
//     const user = await getUserFromRequest(req, db);

//     if (!user) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     if (!jobId || !ObjectId.isValid(jobId)) {
//       return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
//     }

//     const jobsCol = db.collection("ad_jobs");
//     const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

//     if (!job) {
//       return NextResponse.json({ error: "Job not found" }, { status: 404 });
//     }

//     // Ownership check
//     if (job.userId?.toString() !== user._id.toString()) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     // If still queued → retry trigger n8n (safe retry)
//     if (job.status === "queued") {
//       console.log(`Retry triggering n8n for queued job ${jobId}`);
//       const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

//       if (n8nWebhookUrl) {
//         const form = new FormData();
//         form.append("prompt", job.prompt);
//         form.append("jobId", jobId.toString());
//         // If you stored imageUrl in job during create, add it
//         // form.append("imageUrl", job.imageUrl || "");

//         fetch(n8nWebhookUrl, {
//           method: "POST",
//           body: form,
//         }).catch(err => console.error("Retry trigger failed:", err));
//       }
//     }

//     return NextResponse.json(
//       {
//         jobId: job._id.toString(),
//         status: job.status,
//         videoUrl: job.videoUrl,
//         error: job.error,
//         createdAt: job.createdAt,
//         updatedAt: job.updatedAt,
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("JOB GET ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }





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