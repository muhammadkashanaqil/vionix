// // src/app/api/ads/route.js
// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import { getUserFromRequest } from "@/app/lib/auth";
// import { ObjectId } from "mongodb";

// export const dynamic = 'force-dynamic';

// export async function GET(req) {
//   try {
//     const db = await dbConnect();
//     const user = await getUserFromRequest(req, db);

//     if (!user) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     const jobsCol = db.collection("ad_jobs");

//     // Find all jobs for this user, sorted by newest first
//     const jobs = await jobsCol
//       .find({ userId: new ObjectId(user._id) })
//       .sort({ createdAt: -1 }) // newest first
//       .toArray();

//     // Format response (convert ObjectId to string, etc.)
//     const formattedJobs = jobs.map(job => ({
//       jobId: job._id.toString(),
//       prompt: job.prompt,
//       status: job.status,
//       videoUrl: job.videoUrl,
//       error: job.error,
//       creditCost: job.creditCost,
//       createdAt: job.createdAt,
//       updatedAt: job.updatedAt,
//     }));

//     return NextResponse.json({
//       ads: formattedJobs,
//       total: formattedJobs.length,
//     }, { status: 200 });

//   } catch (err) {
//     console.error("LIST ADS ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }



// src/app/api/ads/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const db = await dbConnect();
    const user = await getUserFromRequest(req, db);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const jobsCol = db.collection("ad_jobs");

    // Find all jobs for this user, sorted by newest first
    const jobs = await jobsCol
      .find({ userId: new ObjectId(user._id) })
      .sort({ createdAt: -1 })
      .toArray();

    // Clean up response data structure for the frontend
    const formattedJobs = jobs.map(job => ({
      jobId: job._id.toString(),
      prompt: job.prompt,
      status: job.status,
      imageUrl: job.imageUrl || null, // Included in case you display the source image
      videoUrl: job.videoUrl || null,
      error: job.error || null,
      creditCost: job.creditCost,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));

    return NextResponse.json({
      ads: formattedJobs,
      total: formattedJobs.length,
    }, { status: 200 });

  } catch (err) {
    console.error("LIST ADS ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}