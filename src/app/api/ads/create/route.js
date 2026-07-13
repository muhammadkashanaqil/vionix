<<<<<<< HEAD
// // // src/app/api/ads/create/route.js
// // export const dynamic = 'force-dynamic';

// // import { NextResponse } from "next/server";
// // import { dbConnect } from "@/app/lib/mongodb";
// // import { getUserFromRequest } from "@/app/lib/auth";
// // import { ObjectId } from "mongodb";

// // const AD_COST = 15;

// // function unwrapDoc(result) {
// //   if (!result) return null;
// //   return result.value ?? result;
// // }

// // function extractVideoUrl(data) {
// //   if (!data) return null;

// //   // Handle raw text that might be a direct URL
// //   if (typeof data === "string" && data.startsWith("http")) {
// //     return data;
// //   }

// //   // Accept common keys (including your current n8n lowercase "videourl")
// //   const possibleKeys = [
// //     "videoUrl",     // standard camelCase
// //     "videourl",     // your current n8n key
// //     "video_url",
// //     "resultVideoUrl",
// //     "result_url",
// //     "outputUrl",
// //     "url",
// //     "video",
// //     "generatedVideo",
// //     "finalUrl"
// //   ];

// //   // Direct access
// //   for (const key of possibleKeys) {
// //     if (typeof data[key] === "string") {
// //       // Accept real URLs or "ok" for testing
// //       if (data[key].startsWith("http") || data[key] === "ok") {
// //         return data[key];
// //       }
// //     }
// //   }

// //   // Nested data (some APIs return { data: { ... } })
// //   if (data.data) {
// //     for (const key of possibleKeys) {
// //       if (typeof data.data[key] === "string") {
// //         if (data.data[key].startsWith("http") || data.data[key] === "ok") {
// //           return data.data[key];
// //         }
// //       }
// //     }
// //   }

// //   // Arrays (some return list of URLs)
// //   if (Array.isArray(data.urls) && data.urls[0]?.startsWith("http")) {
// //     return data.urls[0];
// //   }
// //   if (Array.isArray(data.resultUrls) && data.resultUrls[0]?.startsWith("http")) {
// //     return data.resultUrls[0];
// //   }

// //   return null;
// // }

// // export async function POST(req) {
// //   try {
// //     const db = await dbConnect();
// //     const user = await getUserFromRequest(req, db);

// //     if (!user) {
// //       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// //     }

// //     const formData = await req.formData();
// //     const prompt = formData.get("prompt");
// //     const image = formData.get("image");

// //     if (!prompt || !image) {
// //       return NextResponse.json({ error: "Missing prompt or image" }, { status: 400 });
// //     }

// //     const usersCol = db.collection("users");
// //     const jobsCol = db.collection("ad_jobs");

// //     const userId = new ObjectId(user._id);

// //     // 1. Deduct credits
// //     const creditResult = await usersCol.findOneAndUpdate(
// //       { _id: userId, credits: { $gte: AD_COST } },
// //       { $inc: { credits: -AD_COST } },
// //       { returnDocument: "after" }
// //     );

// //     const updatedUser = unwrapDoc(creditResult);
// //     if (!updatedUser) {
// //       return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
// //     }

// //     // 2. Create job
// //     const now = new Date();
// //     const insertResult = await jobsCol.insertOne({
// //       userId,
// //       prompt: String(prompt),
// //       status: "processing",
// //       creditCost: AD_COST,
// //       videoUrl: null,
// //       error: null,
// //       createdAt: now,
// //       updatedAt: now,
// //     });

// //     const jobId = insertResult.insertedId.toString();

// //     // 3. Send to n8n
// //     const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
// //     if (!n8nWebhookUrl) {
// //       throw new Error("N8N_WEBHOOK_URL is not set in environment variables");
// //     }

// //     const n8nForm = new FormData();
// //     n8nForm.append("prompt", String(prompt));
// //     n8nForm.append("image", image, image.name || "uploaded-image.jpg");
// //     n8nForm.append("jobId", jobId);

// //     console.log("→ Sending to n8n:", {
// //       url: n8nWebhookUrl,
// //       jobId,
// //       promptPreview: prompt.substring(0, 100) + "...",
// //       imageName: image.name,
// //     });

// //     const n8nRes = await fetch(n8nWebhookUrl, {
// //       method: "POST",
// //       body: n8nForm,
// //     });

// //     const responseText = await n8nRes.text();

// //     console.log("← n8n response:", {
// //       status: n8nRes.status,
// //       contentType: n8nRes.headers.get("content-type"),
// //       bodyPreview: responseText.substring(0, 800) + (responseText.length > 800 ? "..." : ""),
// //     });

// //     let parsedData;
// //     try {
// //       parsedData = JSON.parse(responseText);
// //       console.log("Parsed n8n JSON:", JSON.stringify(parsedData, null, 2));
// //     } catch (e) {
// //       console.log("n8n response is not JSON - raw:", responseText);
// //       parsedData = { raw: responseText };
// //     }

// //     if (!n8nRes.ok) {
// //       // Refund credits on n8n failure
// //       await usersCol.updateOne(
// //         { _id: userId },
// //         { $inc: { credits: AD_COST } }
// //       );

// //       await jobsCol.updateOne(
// //         { _id: new ObjectId(jobId) },
// //         {
// //           $set: {
// //             status: "failed",
// //             error: `n8n failed (${n8nRes.status}): ${responseText.substring(0, 500)}`,
// //             updatedAt: new Date(),
// //           },
// //         }
// //       );

// //       return NextResponse.json(
// //         { error: "n8n processing failed", status: n8nRes.status, jobId },
// //         { status: 502 }
// //       );
// //     }

// //     const videoUrl = extractVideoUrl(parsedData) || extractVideoUrl(responseText);

// //     if (!videoUrl) {
// //       await jobsCol.updateOne(
// //         { _id: new ObjectId(jobId) },
// //         {
// //           $set: {
// //             status: "failed",
// //             error: `No video URL found in n8n response. Received: ${responseText.substring(0, 300)}`,
// //             updatedAt: new Date(),
// //           },
// //         }
// //       );

// //       return NextResponse.json(
// //         { error: "No video URL in n8n response", jobId },
// //         { status: 500 }
// //       );
// //     }

// //     // 4. Update job as completed
// //     await jobsCol.updateOne(
// //       { _id: new ObjectId(jobId) },
// //       {
// //         $set: {
// //           status: "completed",
// //           videoUrl,
// //           updatedAt: new Date(),
// //         },
// //       }
// //     );

// //     return NextResponse.json({
// //       jobId,
// //       status: "completed",
// //       videoUrl,
// //       creditsRemaining: updatedUser.credits,
// //     }, { status: 200 });

// //   } catch (error) {
// //     console.error("CREATE AD ERROR:", error);
// //     return NextResponse.json(
// //       { error: "Server error", details: error.message },
// //       { status: 500 }
// //     );
// //   }
// // }



// // // src/app/api/ads/create/route.js
// // export const dynamic = 'force-dynamic';

// // import { NextResponse } from "next/server";
// // import { dbConnect } from "@/app/lib/mongodb";
// // import { getUserFromRequest } from "@/app/lib/auth";
// // import { ObjectId } from "mongodb";

// // const AD_COST = 15;

// // function unwrapDoc(result) {
// //   if (!result) return null;
// //   return result.value ?? result;
// // }

// // export async function POST(req) {
// //   try {
// //     const db = await dbConnect();
// //     const user = await getUserFromRequest(req, db);

// //     if (!user) {
// //       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// //     }

// //     const formData = await req.formData();
// //     const prompt = formData.get("prompt");
// //     const image = formData.get("image");

// //     if (!prompt || !image) {
// //       return NextResponse.json({ error: "Missing prompt or image" }, { status: 400 });
// //     }

// //     const usersCol = db.collection("users");
// //     const jobsCol = db.collection("ad_jobs");

// //     const userId = new ObjectId(user._id);

// //     // Deduct credits
// //     const creditResult = await usersCol.findOneAndUpdate(
// //       { _id: userId, credits: { $gte: AD_COST } },
// //       { $inc: { credits: -AD_COST } },
// //       { returnDocument: "after" }
// //     );

// //     const updatedUser = unwrapDoc(creditResult);
// //     if (!updatedUser) {
// //       return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
// //     }

// //     // Create job in "queued" state
// //     const now = new Date();
// //     const insertResult = await jobsCol.insertOne({
// //       userId,
// //       prompt: String(prompt),
// //       status: "queued",
// //       creditCost: AD_COST,
// //       videoUrl: null,
// //       error: null,
// //       createdAt: now,
// //       updatedAt: now,
// //     });

// //     const jobId = insertResult.insertedId.toString();

// //     // Fire-and-forget trigger to n8n
// //     const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
// //     if (n8nWebhookUrl) {
// //       const n8nForm = new FormData();
// //       n8nForm.append("prompt", String(prompt));
// //       n8nForm.append("image", image, image.name || "upload.png");
// //       n8nForm.append("jobId", jobId);

// //       fetch(n8nWebhookUrl, {
// //         method: "POST",
// //         body: n8nForm,
// //       }).catch((err) => {
// //         console.error("n8n trigger error:", err);
// //         // Optional: mark job failed if trigger fails
// //         jobsCol.updateOne({ _id: new ObjectId(jobId) }, { $set: { status: "failed", error: "Failed to trigger n8n" } });
// //       });
// //     } else {
// //       throw new Error("N8N_WEBHOOK_URL not set");
// //     }

// //     // Return immediately
// //     return NextResponse.json({
// //       jobId,
// //       status: "queued",
// //       creditsRemaining: updatedUser.credits,
// //     }, { status: 200 });
// //   } catch (err) {
// //     console.error("ADS CREATE ERROR:", err);
// //     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
// //   }
// // }

// // perfect code

// // src/app/api/ads/create/route.js
// // export const dynamic = 'force-dynamic';

// // import { NextResponse } from "next/server";
// // import { dbConnect } from "@/app/lib/mongodb";
// // import { getUserFromRequest } from "@/app/lib/auth";
// // import { ObjectId } from "mongodb";

// // const AD_COST = 15;

// // function unwrapDoc(result) {
// //   if (!result) return null;
// //   return result.value ?? result;
// // }

// // export async function POST(req) {
// //   try {
// //     const db = await dbConnect();
// //     const user = await getUserFromRequest(req, db);

// //     if (!user) {
// //       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// //     }

// //     const formData = await req.formData();
// //     const prompt = formData.get("prompt");
// //     const image = formData.get("image");

// //     if (!prompt || !image) {
// //       return NextResponse.json({ error: "Missing prompt or image" }, { status: 400 });
// //     }

// //     const usersCol = db.collection("users");
// //     const jobsCol = db.collection("ad_jobs");

// //     const userId = new ObjectId(user._id);

// //     // Deduct credits
// //     const creditResult = await usersCol.findOneAndUpdate(
// //       { _id: userId, credits: { $gte: AD_COST } },
// //       { $inc: { credits: -AD_COST } },
// //       { returnDocument: "after" }
// //     );

// //     const updatedUser = unwrapDoc(creditResult);
// //     if (!updatedUser) {
// //       return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
// //     }

// //     // Create job in "queued" state
// //     const now = new Date();
// //     const insertResult = await jobsCol.insertOne({
// //       userId,
// //       prompt: String(prompt),
// //       status: "queued",
// //       creditCost: AD_COST,
// //       videoUrl: null,
// //       error: null,
// //       createdAt: now,
// //       updatedAt: now,
// //     });

// //     const jobId = insertResult.insertedId.toString();

// //     // Fire-and-forget trigger to n8n
// //     const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
// //     if (n8nWebhookUrl) {
// //       const n8nForm = new FormData();
// //       n8nForm.append("prompt", String(prompt));
// //       n8nForm.append("image", image, image.name || "upload.png");
// //       n8nForm.append("jobId", jobId);

// //       fetch(n8nWebhookUrl, {
// //         method: "POST",
// //         body: n8nForm,
// //       }).catch((err) => {
// //         console.error("n8n trigger error:", err);
// //       });
// //     } else {
// //       console.error("N8N_WEBHOOK_URL not set");
// //     }

// //     // Return immediately - no waiting
// //     return NextResponse.json({
// //       jobId,
// //       status: "queued",
// //       creditsRemaining: updatedUser.credits,
// //     }, { status: 200 });
// //   } catch (err) {
// //     console.error("ADS CREATE ERROR:", err);
// //     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
// //   }
// // }






// // export const dynamic = "force-dynamic";
// // export const runtime = "nodejs";

// // import { NextResponse } from "next/server";
// // import { dbConnect } from "@/app/lib/mongodb";
// // import { getUserFromRequest } from "@/app/lib/auth";
// // import { ObjectId } from "mongodb";
// // import { uploadImageToS3 } from "@/app/lib/aws-s3";

// // const AD_COST = 15;

// // function unwrapDoc(result) {
// //   if (!result) return null;
// //   return result.value ?? result;
// // }

// // export async function POST(req) {
// //   try {
// //     const db = await dbConnect();
// //     const user = await getUserFromRequest(req, db);

// //     if (!user) {
// //       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
// //     }

// //     const formData = await req.formData();
// //     const prompt = formData.get("prompt");
// //     const image = formData.get("image"); // File

// //     if (!prompt || !image) {
// //       return NextResponse.json(
// //         { error: "Missing prompt or image" },
// //         { status: 400 }
// //       );
// //     }

// //     const usersCol = db.collection("users");
// //     const jobsCol = db.collection("ad_jobs");

// //     const userId = new ObjectId(user._id);

// //     // Deduct credits
// //     const creditResult = await usersCol.findOneAndUpdate(
// //       { _id: userId, credits: { $gte: AD_COST } },
// //       { $inc: { credits: -AD_COST } },
// //       { returnDocument: "after" }
// //     );

// //     const updatedUser = unwrapDoc(creditResult);
// //     if (!updatedUser) {
// //       return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
// //     }

// //     // Create job in "queued" state
// //     const now = new Date();
// //     const insertResult = await jobsCol.insertOne({
// //       userId,
// //       prompt: String(prompt),
// //       status: "queued",
// //       creditCost: AD_COST,
// //       imageUrl: null, // ✅ add this
// //       s3Key: null,    // ✅ optional, helps debugging
// //       videoUrl: null,
// //       error: null,
// //       createdAt: now,
// //       updatedAt: now,
// //     });

// //     const jobId = insertResult.insertedId.toString();

// //     // ✅ Upload image to S3 FIRST
// //     let imageUrl = null;
// //     let s3Key = null;

// //     try {
// //       const uploaded = await uploadImageToS3({
// //         file: image,
// //         keyPrefix: `ads/${userId.toString()}/${jobId}`,
// //       });

// //       imageUrl = uploaded.imageUrl;
// //       s3Key = uploaded.key;

// //       // save to mongo (optional but recommended)
// //       await jobsCol.updateOne(
// //         { _id: new ObjectId(jobId) },
// //         { $set: { imageUrl, s3Key, updatedAt: new Date() } }
// //       );
// //     } catch (e) {
// //       console.error("S3 upload failed:", e);
// //       // If S3 fails, mark job failed (and optionally refund credits if you want)
// //       await jobsCol.updateOne(
// //         { _id: new ObjectId(jobId) },
// //         {
// //           $set: {
// //             status: "failed",
// //             error: "Image upload failed",
// //             updatedAt: new Date(),
// //           },
// //         }
// //       );

// //       return NextResponse.json(
// //         { error: "Image upload failed. Try again." },
// //         { status: 500 }
// //       );
// //     }

// //     // ✅ Fire-and-forget trigger to n8n (send URL, not file)
// //     const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
// //     if (n8nWebhookUrl) {
// //       fetch(n8nWebhookUrl, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           prompt: String(prompt),
// //           imageUrl, // ✅ important
// //           jobId,
// //         }),
// //       }).catch((err) => {
// //         console.error("n8n trigger error:", err);
// //       });
// //     } else {
// //       console.error("N8N_WEBHOOK_URL not set");
// //     }

// //     // Return immediately - no waiting
// //     return NextResponse.json(
// //       {
// //         jobId,
// //         status: "queued",
// //         creditsRemaining: updatedUser.credits,
// //       },
// //       { status: 200 }
// //     );
// //   } catch (err) {
// //     console.error("ADS CREATE ERROR:", err);
// //     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
// //   }
// // }





// "use client";

// import { useState } from "react";

// export default function ImageGenerator() {
//   const [prompt, setPrompt] = useState("");
//   const [image, setImage] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!prompt || !image) return alert("Please provide both a prompt and an image.");

//     setLoading(true);
//     setResult(null);

//     // Create FormData to send files + fields
//     const formData = new FormData();
//     formData.append("prompt", prompt);
//     formData.append("image", image);

//     try {
//       const response = await fetch("/api/generate", {
//         method: "POST",
//         body: formData, // Browser automatically sets Content-Type to multipart/form-data
//       });

//       const data = await response.json();
//       setResult(data);
//     } catch (error) {
//       console.error("Upload failed:", error);
//       setResult({ error: "Something went wrong" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-md mx-auto space-y-4 border rounded-xl shadow">
//       <h2 className="text-xl font-bold">Upload to n8n Workflow</h2>
//       <form onSubmit={handleSubmit} className="space-y-3">
//         <div>
//           <label className="block text-sm font-medium">Prompt</label>
//           <input
//             type="text"
//             className="w-full border p-2 rounded"
//             value={prompt}
//             onChange={(e) => setPrompt(e.target.value)}
//             placeholder="Describe what to do..."
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium">Image</label>
//           <input
//             type="file"
//             accept="image/*"
//             className="w-full border p-2 rounded"
//             onChange={(e) => setImage(e.target.files[0])}
//           />
//         </div>
//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
//         >
//           {loading ? "Processing..." : "Submit"}
//         </button>
//       </form>

//       {result && (
//         <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto max-h-60">
//           {JSON.stringify(result, null, 2)}
//         </pre>
//       )}
//     </div>
//   );
=======
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

// perfect code

// src/app/api/ads/create/route.js
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
//       });
//     } else {
//       console.error("N8N_WEBHOOK_URL not set");
//     }

//     // Return immediately - no waiting
//     return NextResponse.json({
//       jobId,
//       status: "queued",
//       creditsRemaining: updatedUser.credits,
//     }, { status: 200 });
//   } catch (err) {
//     console.error("ADS CREATE ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2
// }





<<<<<<< HEAD
// src/app/api/ads/create/route.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
=======

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2

import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
<<<<<<< HEAD
=======
import { uploadImageToS3 } from "@/app/lib/aws-s3";
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2

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
<<<<<<< HEAD
    const image = formData.get("image"); // This is the File object from client
=======
    const image = formData.get("image"); // File
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2

    if (!prompt || !image) {
      return NextResponse.json(
        { error: "Missing prompt or image" },
        { status: 400 }
      );
    }

    const usersCol = db.collection("users");
    const jobsCol = db.collection("ad_jobs");

    const userId = new ObjectId(user._id);

<<<<<<< HEAD
    // 1. Deduct credits
=======
    // Deduct credits
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2
    const creditResult = await usersCol.findOneAndUpdate(
      { _id: userId, credits: { $gte: AD_COST } },
      { $inc: { credits: -AD_COST } },
      { returnDocument: "after" }
    );

    const updatedUser = unwrapDoc(creditResult);
    if (!updatedUser) {
      return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
    }

<<<<<<< HEAD
    // 2. Create job in "queued" state (no imageUrl needed since we pass file to n8n)
=======
    // Create job in "queued" state
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2
    const now = new Date();
    const insertResult = await jobsCol.insertOne({
      userId,
      prompt: String(prompt),
      status: "queued",
      creditCost: AD_COST,
<<<<<<< HEAD
      imageUrl: null, 
=======
      imageUrl: null, // ✅ add this
      s3Key: null,    // ✅ optional, helps debugging
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2
      videoUrl: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    });

    const jobId = insertResult.insertedId.toString();

<<<<<<< HEAD
    // 3. Send the image file DIRECTLY to n8n (no S3 middleman)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      const n8nForm = new FormData();
      n8nForm.append("prompt", String(prompt));
      n8nForm.append("image", image, image.name || "upload.png");
      n8nForm.append("jobId", jobId);

      // Fire-and-forget: n8n works in background, we don't wait for `.then()`
      fetch(n8nWebhookUrl, {
        method: "POST",
        body: n8nForm, // Browser/Node environment sets content-type multipart/form-data automatically
      }).catch((err) => {
        console.error("n8n trigger error:", err);
        // Optional background status update if trigger fails completely
        jobsCol.updateOne(
          { _id: new ObjectId(jobId) },
          { $set: { status: "failed", error: "Could not trigger background worker" } }
        ).catch(e => console.error("Failed updating failed status:", e));
=======
    // ✅ Upload image to S3 FIRST
    let imageUrl = null;
    let s3Key = null;

    try {
      const uploaded = await uploadImageToS3({
        file: image,
        keyPrefix: `ads/${userId.toString()}/${jobId}`,
      });

      imageUrl = uploaded.imageUrl;
      s3Key = uploaded.key;

      // save to mongo (optional but recommended)
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        { $set: { imageUrl, s3Key, updatedAt: new Date() } }
      );
    } catch (e) {
      console.error("S3 upload failed:", e);
      // If S3 fails, mark job failed (and optionally refund credits if you want)
      await jobsCol.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            status: "failed",
            error: "Image upload failed",
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        { error: "Image upload failed. Try again." },
        { status: 500 }
      );
    }

    // ✅ Fire-and-forget trigger to n8n (send URL, not file)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: String(prompt),
          imageUrl, // ✅ important
          jobId,
        }),
      }).catch((err) => {
        console.error("n8n trigger error:", err);
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2
      });
    } else {
      console.error("N8N_WEBHOOK_URL not set");
    }

<<<<<<< HEAD
    // 4. Return success response immediately (so the UI updates fast!)
=======
    // Return immediately - no waiting
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2
    return NextResponse.json(
      {
        jobId,
        status: "queued",
        creditsRemaining: updatedUser.credits,
      },
      { status: 200 }
    );
<<<<<<< HEAD

  } catch (err) {
    console.error("ADS CREATE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
=======
  } catch (err) {
    console.error("ADS CREATE ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2
