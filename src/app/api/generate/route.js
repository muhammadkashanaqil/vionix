// import { NextResponse } from "next/server";

// export async function POST(request) {
//   try {
//     const incoming = await request.formData();
//     const prompt = incoming.get("prompt");
//     const image = incoming.get("image"); // File

//     if (!prompt || !image) {
//       return NextResponse.json(
//         { error: "Missing prompt or image" },
//         { status: 400 }
//       );
//     }

//     const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
//       || "https://vionixtest.app.n8n.cloud/webhook/vionix";

//     // Forward as multipart/form-data to n8n (same as your working setup)
//     const out = new FormData();
//     out.append("prompt", prompt);
//     out.append("image", image, image.name || "upload.png");

//     // const n8nRes = await fetch(n8nWebhookUrl, {
//     //   method: "POST",
//     //   body: out, // ✅ don't set Content-Type manually
//     // });


// const n8nRes = await fetch(n8nWebhookUrl, {
//   method: "POST",
//   body: out,
//   redirect: "follow",
// });

// // ADD THESE LINES temporarily
// console.log("n8n status:", n8nRes.status);
// console.log("n8n ok:", n8nRes.ok);
// console.log("n8n headers:", Object.fromEntries(n8nRes.headers.entries()));
// const text2 = await n8nRes.text();
// console.log("n8n raw response:", text2);


//     const text = await n8nRes.text();
//     let parsed;
//     try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }

//     if (!n8nRes.ok) {
//       return NextResponse.json(
//         { error: "n8n error", status: n8nRes.status, details: parsed },
//         { status: 502 }
//       );
//     }

//     // ✅ Return n8n response to frontend
//     return NextResponse.json(
//       {
//         ok: true,
//         n8nStatus: n8nRes.status,
//         n8nResult: parsed,
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("GENERATE ERROR:", err);
//     return NextResponse.json(
//       { error: "Failed to trigger n8n webhook", details: String(err?.message || err) },
//       { status: 500 }
//     );
//   }
// }



import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const incoming = await request.formData();
    const prompt = incoming.get("prompt");
    const image = incoming.get("image");

    if (!prompt || !image) {
      return NextResponse.json(
        { error: "Missing prompt or image" },
        { status: 400 }
      );
    }

    const n8nWebhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      "https://testvionix.app.n8n.cloud/webhook/vionix";

    const out = new FormData();
    out.append("prompt", prompt);
    out.append("image", image, image.name || "upload.png");

    const n8nRes = await fetch(n8nWebhookUrl, {
      method: "POST",
      body: out,
      redirect: "follow",
    });

    // ✅ Read body only once
    const text = await n8nRes.text();

    // Debug logs — check your terminal
    console.log("n8n status:", n8nRes.status);
    console.log("n8n ok:", n8nRes.ok);
    console.log("n8n raw response:", text);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    if (!n8nRes.ok) {
      return NextResponse.json(
        { error: "n8n error", status: n8nRes.status, details: parsed },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        n8nStatus: n8nRes.status,
        n8nResult: parsed,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GENERATE ERROR:", err);
    return NextResponse.json(
      {
        error: "Failed to trigger n8n webhook",
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
