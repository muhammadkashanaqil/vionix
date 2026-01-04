// // app/api/credits/route.js
// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import { getUserFromRequest } from "@/app/lib/auth";

// export async function GET(req) {
//   try {
//     const db = await dbConnect();
//     const user = await getUserFromRequest(req, db);

//     if (!user) {
//       return NextResponse.json(
//         { error: "Not authenticated" },
//         { status: 401 }
//       );
//     }

//     return NextResponse.json(
//       { credits: user.credits ?? 0 },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("CREDITS GET ERROR:", err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }




// after: const result = await jobsCol.insertOne(job);
// const jobId = result.insertedId.toString();

// try {
//   const webhookUrl = process.env.N8N_WEBHOOK_URL;        // your n8n "start generation" webhook
//   const callbackBase = process.env.APP_BASE_URL;         // e.g. https://vionix-beta.vercel.app
//   const secret = process.env.N8N_WEBHOOK_SECRET;         // shared secret

//   if (!webhookUrl || !callbackBase || !secret) {
//     console.warn("Missing N8N_WEBHOOK_URL / APP_BASE_URL / N8N_WEBHOOK_SECRET");
//   } else {
//     await fetch(webhookUrl, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         jobId,
//         prompt,
//         imageUrl,     // use S3 publicUrl
//         imageKey,
//         callbackUrl: `${callbackBase}/api/webhooks/n8n`, // this is your callback route
//         secret,       // pass to n8n so it can return it back
//       }),
//     });
//   }
// } catch (e) {
//   console.error("Error calling n8n webhook:", e);

//   // optional: mark job failed OR refund credits
//   await jobsCol.updateOne(
//     { _id: result.insertedId },
//     { $set: { status: "failed", error: "Failed to trigger n8n", updatedAt: new Date() } }
//   );
// }



import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";

export async function GET(req) {
  try {
    const db = await dbConnect();                 // ✅ inside GET
    const user = await getUserFromRequest(req, db);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json(
      { credits: user.credits ?? 0 },
      { status: 200 }
    );
  } catch (err) {
    console.error("CREDITS GET ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

