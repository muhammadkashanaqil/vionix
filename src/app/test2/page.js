"use client";

import { useState } from "react";

export default function CreateAdPage() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!file) return setError("Please upload a product image.");
    if (!prompt.trim()) return setError("Please write a prompt.");

    setLoading(true);

    try {
      const form = new FormData();
      form.append("image", file);              // ✅ binary file
      form.append("prompt", prompt.trim());    // ✅ text

      const res = await fetch("/api/generate", {
        method: "POST",
        body: form, // ✅ multipart/form-data (browser sets boundary)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 20 }}>
      <h1>Create New Ad</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Product Image
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <label>
          Prompt
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Create a 10s UGC style video ad with upbeat energy..."
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {/* Example response handling */}
      {result && (
        <div style={{ marginTop: 20 }}>
          <pre style={{ background: "#f6f6f6", padding: 12, overflow: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>

          {/* If n8n returns { videoUrl: "..." } */}
          {result.videoUrl && (
            <video
              src={result.videoUrl}
              controls
              style={{ width: "100%", marginTop: 12 }}
            />
          )}
        </div>
      )}
    </div>
  );
}
