// "use client";
// import { useState } from "react";

// export default function Home() {
//   const [loading, setLoading] = useState(false);
//   const [taskId, setTaskId] = useState(null);
//   const [videoUrl, setVideoUrl] = useState(null);
//   const [status, setStatus] = useState(null);

//   const startVideo = async () => {
//     setLoading(true);
//     setVideoUrl(null);

//     const res = await fetch("/api/start-video", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         image: "https://example.com/image.png",
//         prompt: "Create ad video",
//       }),
//     });

//     const data = await res.json();
//     setTaskId(data.taskId);
//     setStatus("processing");

//     pollStatus(data.taskId);
//   };

//   const pollStatus = (id) => {
//     const interval = setInterval(async () => {
//       const res = await fetch(`/api/task-status?taskId=${id}`);
//       const data = await res.json();

//       setStatus(data.status);

//       if (data.status === "done") {
//         setVideoUrl(data.videoUrl);
//         setLoading(false);
//         clearInterval(interval);
//       }

//       if (data.status === "failed") {
//         alert("Video generation failed");
//         setLoading(false);
//         clearInterval(interval);
//       }
//     }, 5000);
//   };

//   return (
//     <main style={{ padding: 40 }}>
//       <button onClick={startVideo} disabled={loading}>
//         {loading ? "Generating..." : "Generate Video"}
//       </button>

//       {status && <p>Status: {status}</p>}

//       {videoUrl && (
//         <video src={videoUrl} controls width="400" />
//       )}
//     </main>
//   );
// }









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
  const [pollAttempts, setPollAttempts] = useState(0);

  // Fetch credits on mount
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
      console.error("Credits fetch error:", err);
      setCredits(null);
    }
  };

  const handleGenerate = async () => {
    if (!file || !prompt.trim()) {
      setStatus("Please select an image and enter a prompt");
      return;
    }

    setLoading(true);
    setStatus("Starting generation...");
    setVideoUrl(null);
    setJobId(null);
    setPollAttempts(0);

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
        throw new Error(data.error || data.details || "Failed to start generation");
      }

      if (!data.jobId) {
        throw new Error("No job ID returned from server");
      }

      setJobId(data.jobId);
      setStatus("Queued... Checking status every 30 seconds (up to 10 minutes)");
      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining);
      }
      fetchCredits();
    } catch (err) {
      setStatus(`Error: ${err.message || "Unknown error"}`);
      console.error("Generate error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Polling: every 30 seconds, up to 20 attempts (10 minutes total)
  useEffect(() => {
    if (!jobId) return;

    const MAX_ATTEMPTS = 20;
    const POLL_INTERVAL = 30000; // 30 seconds

    const intervalId = setInterval(async () => {
      if (pollAttempts >= MAX_ATTEMPTS) {
        setStatus("Timed out after 10 minutes - generation may be taking longer or failed");
        clearInterval(intervalId);
        return;
      }

      setPollAttempts((prev) => prev + 1);
      setStatus(`Checking status... (attempt ${pollAttempts + 1}/${MAX_ATTEMPTS})`);

      try {
        const res = await fetch(`/api/ads/${jobId}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Polling failed: ${res.status}`);
        }

        const data = await res.json();

        if (data.status === "completed") {
          setVideoUrl(data.videoUrl);
          setStatus("Generation complete! Video ready.");
          clearInterval(intervalId);
          fetchCredits(); // Refresh credits after success
        } else if (data.status === "failed") {
          setStatus(`Failed: ${data.error || "Unknown error"}`);
          clearInterval(intervalId);
        } else {
          setStatus(`Processing... (${data.status || "in progress"}) - attempt ${pollAttempts + 1}/${MAX_ATTEMPTS}`);
        }
      } catch (err) {
        console.error("Polling error:", err);
        setStatus("Polling error - try refreshing the page");
      }
    }, POLL_INTERVAL);

    // Cleanup on unmount or jobId change
    return () => clearInterval(intervalId);
  }, [jobId, pollAttempts]);

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Create Video Ad</h1>

      <div style={{ marginBottom: "1.5rem" }}>
        <strong>Credits:</strong> {credits !== null ? credits : "Loading..."}
      </div>

      {jobId && (
        <div style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>
          <strong>Job ID:</strong> {jobId}
        </div>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={loading}
        />
      </div>

      <textarea
        rows={5}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your video ad..."
        disabled={loading}
        style={{
          width: "100%",
          padding: "0.8rem",
          borderRadius: "6px",
          border: "1px solid #ddd",
          marginBottom: "1.5rem",
        }}
      />

      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={handleGenerate}
          disabled={!file || !prompt.trim() || loading}
          style={{
            padding: "0.8rem 1.8rem",
            backgroundColor: file && prompt.trim() && !loading ? "#0070f3" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: file && prompt.trim() && !loading ? "pointer" : "not-allowed",
            marginRight: "1rem",
          }}
        >
          {loading ? "Starting..." : "Generate Video"}
        </button>

        <button
          onClick={fetchCredits}
          disabled={loading}
          style={{
            padding: "0.8rem 1.5rem",
            backgroundColor: "#f0f0f0",
            border: "1px solid #ddd",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Refresh Credits
        </button>
      </div>

      {status && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: status.includes("Error") || status.includes("Failed") || status.includes("Timed out")
              ? "#ffebee"
              : status.includes("complete")
              ? "#e8f5e9"
              : "#fff3e0",
            borderRadius: "6px",
            marginBottom: "2rem",
          }}
        >
          <strong>Status:</strong> {status}
        </div>
      )}

      {videoUrl && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Your Generated Video</h3>
          <video
            src={videoUrl}
            controls
            autoPlay
            style={{
              width: "100%",
              maxWidth: "700px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <p style={{ marginTop: "0.8rem" }}>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0070f3" }}
            >
              Open video in new tab
            </a>
          </p>
        </div>
      )}
    </div>
  );
}