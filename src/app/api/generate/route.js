import { NextResponse } from "next/server";

export const runtime = "nodejs"; // important for Buffer/FormData forwarding in many cases

export async function POST(req) {
  try {
    const incoming = await req.formData();

    const file = incoming.get("image");
    const prompt = incoming.get("prompt");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Image is required." }, { status: 400 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    // ✅ Forward as multipart/form-data to n8n
    const out = new FormData();
    out.append("prompt", prompt);
    out.append("image", file, file.name || "product.png"); // keep binary

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_URL is not set." },
        { status: 500 }
      );
    }

    const n8nRes = await fetch(webhookUrl, {
      method: "POST",
      body: out,
      // DO NOT set Content-Type manually when using FormData
    });

    const text = await n8nRes.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (!n8nRes.ok) {
      return NextResponse.json(
        {
          error: "n8n webhook failed",
          status: n8nRes.status,
          response: json,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(json, { status: 200 });
  } catch (err) {
    console.error("API /generate error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
