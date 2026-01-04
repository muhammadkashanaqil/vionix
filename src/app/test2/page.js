"use client";

import { useEffect, useRef, useState } from "react";

export default function Test3Page() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [credits, setCredits] = useState(null);

  const stopRef = useRef(false);

  useEffect(() => {
    stopRef.current = false;
    refreshCredits();
    return () => {
      stopRef.current = true;
    };
  }, []);

  async function refreshCredits() {
    try {
      const res = await fetch("/api/credits", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCredits(null);
        return;
      }
      setCredits(data.credits ?? 0);
    } catch {
      setCredits(null);
    }
  }

  async function handleGenerate() {
    stopRef.current = false;

    try {
      setLoading(true);
      setStatus("");
      setVideoUrl("");
      setJobId("");

      if (!file) throw new Error("Please choose an image");
      if (!prompt.trim()) throw new Error("Please enter a prompt");

      setStatus("Creating job + sending to n8n...");

      // ✅ Send file directly to backend (NO AWS)
      const form = new FormData();
      form.append("prompt", prompt.trim());
      form.append("image", file);

      const createRes = await fetch("/api/ads/create", {
        method: "POST",
        body: form, // ✅ multipart
        credentials: "include",
      });

      const job = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(job.error || "Create job failed");

      if (!job.jobId) throw new Error("No jobId returned.");

      setJobId(job.jobId);

      if (typeof job.creditsRemaining === "number") {
        setCredits(job.creditsRemaining);
      } else {
        await refreshCredits();
      }

      setStatus("Processing... (polling)");

      const url = await pollJob(job.jobId);
      setVideoUrl(url);
      setStatus("Completed ✅");
    } catch (e) {
      setStatus("❌ " + (e?.message || "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  async function pollJob(id) {
    const maxAttempts = 300; // 10 minutes

    for (let i = 1; i <= maxAttempts; i++) {
      if (stopRef.current) throw new Error("Stopped");

      const res = await fetch(`/api/ads/${id}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Polling failed (${res.status})`);

      if (data.status === "completed") return data.videoUrl;
      if (data.status === "failed") throw new Error(data.error || "Job failed");

      setStatus(`Processing... (${data.status || "waiting"}) • ${i}/${maxAttempts}`);
      await new Promise((r) => setTimeout(r, 2000));
    }

    throw new Error("Timed out waiting for completion");
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Create Ad (No AWS)</h2>

      <div style={{ marginBottom: 12 }}>
        <b>Credits:</b> {credits === null ? "—" : credits}
      </div>

      <input
        type="file"
        accept="image/*"
        disabled={loading}
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <br /><br />

      <textarea
        rows={6}
        style={{ width: 650, maxWidth: "100%" }}
        value={prompt}
        disabled={loading}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter prompt..."
      />
      <br /><br />

      <button disabled={loading} onClick={handleGenerate}>
        {loading ? "Generating..." : "Generate"}
      </button>

      <p style={{ marginTop: 12 }}>{status}</p>

      {jobId ? (
        <div style={{ marginTop: 8 }}>
          <b>Job:</b> <code>{jobId}</code>
        </div>
      ) : null}

      {videoUrl ? (
        <div style={{ marginTop: 16 }}>
          <video src={videoUrl} controls style={{ width: 650, maxWidth: "100%" }} />
        </div>
      ) : null}
    </div>
  );
}
