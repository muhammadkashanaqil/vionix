// // src/app/api/ads/create/route.js
// export const dynamic = 'force-dynamic';

// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import { getUserFromRequest } from "@/app/lib/auth";
// import { ObjectId } from "mongodb";

// const AD_COST = 15;

// function unwrapDoc(result) {
//   if (!result) return null;
//   return result.value ?? result;
// }

// function extractVideoUrl(data) {
//   if (!data) return null;

//   // Handle raw text that might be a direct URL
//   if (typeof data === "string" && data.startsWith("http")) {
//     return data;
//   }

//   // Accept common keys (including your current n8n lowercase "videourl")
//   const possibleKeys = [
//     "videoUrl",     // standard camelCase
//     "videourl",     // your current n8n key
//     "video_url",
//     "resultVideoUrl",
//     "result_url",
//     "outputUrl",
//     "url",
//     "video",
//     "generatedVideo",
//     "finalUrl"
//   ];

//   // Direct access
//   for (const key of possibleKeys) {
//     if (typeof data[key] === "string") {
//       // Accept real URLs or "ok" for testing
//       if (data[key].startsWith("http") || data[key] === "ok") {
//         return data[key];
//       }
//     }
//   }

//   // Nested data (some APIs return { data: { ... } })
//   if (data.data) {
//     for (const key of possibleKeys) {
//       if (typeof data.data[key] === "string") {
//         if (data.data[key].startsWith("http") || data.data[key] === "ok") {
//           return data.data[key];
//         }
//       }
//     }
//   }

//   // Arrays (some return list of URLs)
//   if (Array.isArray(data.urls) && data.urls[0]?.startsWith("http")) {
//     return data.urls[0];
//   }
//   if (Array.isArray(data.resultUrls) && data.resultUrls[0]?.startsWith("http")) {
//     return data.resultUrls[0];
//   }

//   return null;
// }

// export async function POST(req) {
//   try {
//     const db = await dbConnect();
//     const user = await getUserFromRequest(req, db);

//     if (!user) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     const formData = await req.formData();
//     const prompt = formData.get("prompt");
//     const image = formData.get("image");

//     if (!prompt || !image) {
//       return NextResponse.json({ error: "Missing prompt or image" }, { status: 400 });
//     }

//     const usersCol = db.collection("users");
//     const jobsCol = db.collection("ad_jobs");

//     const userId = new ObjectId(user._id);

//     // 1. Deduct credits
//     const creditResult = await usersCol.findOneAndUpdate(
//       { _id: userId, credits: { $gte: AD_COST } },
//       { $inc: { credits: -AD_COST } },
//       { returnDocument: "after" }
//     );

//     const updatedUser = unwrapDoc(creditResult);
//     if (!updatedUser) {
//       return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
//     }

//     // 2. Create job
//     const now = new Date();
//     const insertResult = await jobsCol.insertOne({
//       userId,
//       prompt: String(prompt),
//       status: "processing",
//       creditCost: AD_COST,
//       videoUrl: null,
//       error: null,
//       createdAt: now,
//       updatedAt: now,
//     });

//     const jobId = insertResult.insertedId.toString();

//     // 3. Send to n8n
//     const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
//     if (!n8nWebhookUrl) {
//       throw new Error("N8N_WEBHOOK_URL is not set in environment variables");
//     }

//     const n8nForm = new FormData();
//     n8nForm.append("prompt", String(prompt));
//     n8nForm.append("image", image, image.name || "uploaded-image.jpg");
//     n8nForm.append("jobId", jobId);

//     console.log("→ Sending to n8n:", {
//       url: n8nWebhookUrl,
//       jobId,
//       promptPreview: prompt.substring(0, 100) + "...",
//       imageName: image.name,
//     });

//     const n8nRes = await fetch(n8nWebhookUrl, {
//       method: "POST",
//       body: n8nForm,
//     });

//     const responseText = await n8nRes.text();

//     console.log("← n8n response:", {
//       status: n8nRes.status,
//       contentType: n8nRes.headers.get("content-type"),
//       bodyPreview: responseText.substring(0, 800) + (responseText.length > 800 ? "..." : ""),
//     });

//     let parsedData;
//     try {
//       parsedData = JSON.parse(responseText);
//       console.log("Parsed n8n JSON:", JSON.stringify(parsedData, null, 2));
//     } catch (e) {
//       console.log("n8n response is not JSON - raw:", responseText);
//       parsedData = { raw: responseText };
//     }

//     if (!n8nRes.ok) {
//       // Refund credits on n8n failure
//       await usersCol.updateOne(
//         { _id: userId },
//         { $inc: { credits: AD_COST } }
//       );

//       await jobsCol.updateOne(
//         { _id: new ObjectId(jobId) },
//         {
//           $set: {
//             status: "failed",
//             error: `n8n failed (${n8nRes.status}): ${responseText.substring(0, 500)}`,
//             updatedAt: new Date(),
//           },
//         }
//       );

//       return NextResponse.json(
//         { error: "n8n processing failed", status: n8nRes.status, jobId },
//         { status: 502 }
//       );
//     }

//     const videoUrl = extractVideoUrl(parsedData) || extractVideoUrl(responseText);

//     if (!videoUrl) {
//       await jobsCol.updateOne(
//         { _id: new ObjectId(jobId) },
//         {
//           $set: {
//             status: "failed",
//             error: `No video URL found in n8n response. Received: ${responseText.substring(0, 300)}`,
//             updatedAt: new Date(),
//           },
//         }
//       );

//       return NextResponse.json(
//         { error: "No video URL in n8n response", jobId },
//         { status: 500 }
//       );
//     }

//     // 4. Update job as completed
//     await jobsCol.updateOne(
//       { _id: new ObjectId(jobId) },
//       {
//         $set: {
//           status: "completed",
//           videoUrl,
//           updatedAt: new Date(),
//         },
//       }
//     );

//     return NextResponse.json({
//       jobId,
//       status: "completed",
//       videoUrl,
//       creditsRemaining: updatedUser.credits,
//     }, { status: 200 });

//   } catch (error) {
//     console.error("CREATE AD ERROR:", error);
//     return NextResponse.json(
//       { error: "Server error", details: error.message },
//       { status: 500 }
//     );
//   }
// }



// // src/app/api/ads/create/route.js
// export const dynamic = 'force-dynamic';

// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import { getUserFromRequest } from "@/app/lib/auth";
// import { ObjectId } from "mongodb";

// const AD_COST = 15;

// function unwrapDoc(result) {
//   if (!result) return null;
//   return result.value ?? result;
// }

// export async function POST(req) {
//   try {
//     const db = await dbConnect();
//     const user = await getUserFromRequest(req, db);

//     if (!user) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     const formData = await req.formData();
//     const prompt = formData.get("prompt");
//     const image = formData.get("image");

//     if (!prompt || !image) {
//       return NextResponse.json({ error: "Missing prompt or image" }, { status: 400 });
//     }

//     const usersCol = db.collection("users");
//     const jobsCol = db.collection("ad_jobs");

//     const userId = new ObjectId(user._id);

//     // Deduct credits
//     const creditResult = await usersCol.findOneAndUpdate(
//       { _id: userId, credits: { $gte: AD_COST } },
//       { $inc: { credits: -AD_COST } },
//       { returnDocument: "after" }
//     );

//     const updatedUser = unwrapDoc(creditResult);
//     if (!updatedUser) {
//       return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
//     }

//     // Create job in "queued" state
//     const now = new Date();
//     const insertResult = await jobsCol.insertOne({
//       userId,
//       prompt: String(prompt),
//       status: "queued",
//       creditCost: AD_COST,
//       videoUrl: null,
//       error: null,
//       createdAt: now,
//       updatedAt: now,
//     });

//     const jobId = insertResult.insertedId.toString();

//     // Fire-and-forget trigger to n8n
//     const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
//     if (n8nWebhookUrl) {
//       const n8nForm = new FormData();
//       n8nForm.append("prompt", String(prompt));
//       n8nForm.append("image", image, image.name || "upload.png");
//       n8nForm.append("jobId", jobId);

//       fetch(n8nWebhookUrl, {
//         method: "POST",
//         body: n8nForm,
//       }).catch((err) => {
//         console.error("n8n trigger error:", err);
//         // Optional: mark job failed if trigger fails
//         jobsCol.updateOne({ _id: new ObjectId(jobId) }, { $set: { status: "failed", error: "Failed to trigger n8n" } });
//       });
//     } else {
//       throw new Error("N8N_WEBHOOK_URL not set");
//     }

//     // Return immediately
//     return NextResponse.json({
//       jobId,
//       status: "queued",
//       creditsRemaining: updatedUser.credits,
//     }, { status: 200 });
//   } catch (err) {
//     console.error("ADS CREATE ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }



// src/app/api/ads/create/route.js
export const dynamic = 'force-dynamic';

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

    const formData = await req.formData();
    const prompt = formData.get("prompt");
    const image = formData.get("image");

    if (!prompt || !image) {
      return NextResponse.json({ error: "Missing prompt or image" }, { status: 400 });
    }

    const usersCol = db.collection("users");
    const jobsCol = db.collection("ad_jobs");

    const userId = new ObjectId(user._id);

    // Deduct credits
    const creditResult = await usersCol.findOneAndUpdate(
      { _id: userId, credits: { $gte: AD_COST } },
      { $inc: { credits: -AD_COST } },
      { returnDocument: "after" }
    );

    const updatedUser = unwrapDoc(creditResult);
    if (!updatedUser) {
      return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
    }

    // Create job in "queued" state
    const now = new Date();
    const insertResult = await jobsCol.insertOne({
      userId,
      prompt: String(prompt),
      status: "queued",
      creditCost: AD_COST,
      videoUrl: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    });

    const jobId = insertResult.insertedId.toString();

    // Fire-and-forget trigger to n8n
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      const n8nForm = new FormData();
      n8nForm.append("prompt", String(prompt));
      n8nForm.append("image", image, image.name || "upload.png");
      n8nForm.append("jobId", jobId);

      fetch(n8nWebhookUrl, {
        method: "POST",
        body: n8nForm,
      }).catch((err) => {
        console.error("n8n trigger error:", err);
      });
    } else {
      console.error("N8N_WEBHOOK_URL not set");
    }

    // Return immediately - no waiting
    return NextResponse.json({
      jobId,
      status: "queued",
      creditsRemaining: updatedUser.credits,
    }, { status: 200 });
  } catch (err) {
    console.error("ADS CREATE ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}