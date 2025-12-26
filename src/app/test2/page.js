"use client";
import { useState } from "react";

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");

    if (!prompt.trim()) return setStatus("Write a prompt");
    if (!file) return setStatus("Upload an image");

    try {
      const form = new FormData();
      form.append("prompt", prompt.trim());
      form.append("image", file); // key name: "image"

      const res = await fetch("/api/generate", {
        method: "POST",
        body: form, // IMPORTANT: don't set Content-Type manually
      });

      const text = await res.text(); // n8n might return non-JSON sometimes
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (!res.ok) throw new Error(data?.error || text || "Request failed");

      setStatus("✅ Sent to n8n: " + (data?.message || "OK"));
      console.log("Response:", data);
    } catch (err) {
      console.error(err);
      setStatus("❌ " + err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 20 }}>
      <h2>Trigger n8n webhook</h2>

      <input
        type="text"
        placeholder="Enter prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{ width: 400, padding: 8, display: "block", marginBottom: 10 }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <button type="submit">Send</button>

      <p style={{ marginTop: 10 }}>{status}</p>
    </form>
  );
}
