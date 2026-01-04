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



import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";

export async function GET(req, context) {
  try {
    const db = await dbConnect();
    const user = await getUserFromRequest(req, db);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ✅ Next.js (newer) requires awaiting params
    const { jobId } = await context.params;

    if (!jobId || !ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    const jobsCol = db.collection("ad_jobs");
    const job = await jobsCol.findOne({ _id: new ObjectId(jobId) });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // ✅ userId in job is ObjectId
    if (job.userId?.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      {
        jobId: job._id.toString(),
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
