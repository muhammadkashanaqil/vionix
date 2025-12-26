import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const incoming = await request.formData();
    const prompt = incoming.get("prompt");
    const image = incoming.get("image"); // File

    if (!prompt || !image) {
      return NextResponse.json(
        { error: "Missing prompt or image" },
        { status: 400 }
      );
    }

    // Your n8n webhook URL
    const n8nWebhookUrl = "https://testtestesttest.app.n8n.cloud/webhook/test";

    // Forward as multipart/form-data to n8n
    const out = new FormData();
    out.append("prompt", prompt);
    out.append("image", image, image.name); // keep filename

    const n8nRes = await fetch(n8nWebhookUrl, {
      method: "POST",
      body: out, // IMPORTANT: don't set Content-Type manually
    });

    const text = await n8nRes.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }

    if (!n8nRes.ok) {
      return NextResponse.json(
        { error: "n8n error", status: n8nRes.status, details: parsed },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "n8n workflow triggered successfully",
      n8nResult: parsed,
    });
  } catch (err) {
    console.error("Trigger error:", err);
    return NextResponse.json(
      { error: "Failed to trigger n8n webhook", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
