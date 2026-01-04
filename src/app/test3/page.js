// src/app/test3/page.js
"use client";

import { useEffect, useState } from "react";

export default function TestPage() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/credits", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch credits");
      const data = await res.json();
      setCredits(data.credits ?? 0);
    } catch (err) {
      console.error("Credits error:", err);
      setCredits(null);
    }
  };

  const handleGenerate = async () => {
    if (!file || !prompt.trim()) {
      setStatus("Select image and enter prompt");
      return;
    }

    setLoading(true);
    setStatus("Starting...");
    setVideoUrl(null);
    setJobId(null);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt.trim());
      formData.append("image", file);

      const res = await fetch("/api/ads/create", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Start failed");
      }

      if (!data.jobId) {
        throw new Error("No job ID");
      }

      setJobId(data.jobId);
      setStatus("Queued... Checking every 30 seconds");
      if (data.creditsRemaining !== undefined) setCredits(data.creditsRemaining);
      fetchCredits();
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Polling: every 30 seconds, unlimited until completed or manual stop
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/ads/${jobId}`, { credentials: "include" });
        if (!res.ok) throw new Error("Poll failed");

        const data = await res.json();

        if (data.status === "completed") {
          setVideoUrl(data.videoUrl);
          setStatus("Complete! Video ready.");
          clearInterval(interval);
          fetchCredits();
        } else if (data.status === "failed") {
          setStatus(`Failed: ${data.error || "Unknown"}`);
          clearInterval(interval);
        } else {
          setStatus(`Processing... (${data.status})`);
        }
      } catch (err) {
        console.error("Poll error:", err);
        setStatus("Polling error - refresh page");
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Create Video Ad</h1>

      <p><strong>Credits:</strong> {credits ?? "Loading..."}</p>

      {jobId && <p><strong>Job ID:</strong> {jobId}</p>}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        disabled={loading}
      />

      <textarea
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter prompt..."
        disabled={loading}
        style={{ width: "100%", margin: "1rem 0" }}
      />

      <button
        onClick={handleGenerate}
        disabled={loading || !file || !prompt.trim()}
        style={{
          padding: "12px 24px",
          background: loading ? "#ccc" : "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Starting..." : "Generate Video"}
      </button>

      {status && (
        <p style={{ marginTop: "1.5rem", fontWeight: "bold" }}>
          Status: {status}
        </p>
      )}

      {videoUrl && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Video Ready</h3>
          <video src={videoUrl} controls width="100%" />
        </div>
      )}
    </div>
  );
}