"use client";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [status, setStatus] = useState(null);

  const startVideo = async () => {
    setLoading(true);
    setVideoUrl(null);

    const res = await fetch("/api/start-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: "https://example.com/image.png",
        prompt: "Create ad video",
      }),
    });

    const data = await res.json();
    setTaskId(data.taskId);
    setStatus("processing");

    pollStatus(data.taskId);
  };

  const pollStatus = (id) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/task-status?taskId=${id}`);
      const data = await res.json();

      setStatus(data.status);

      if (data.status === "done") {
        setVideoUrl(data.videoUrl);
        setLoading(false);
        clearInterval(interval);
      }

      if (data.status === "failed") {
        alert("Video generation failed");
        setLoading(false);
        clearInterval(interval);
      }
    }, 5000);
  };

  return (
    <main style={{ padding: 40 }}>
      <button onClick={startVideo} disabled={loading}>
        {loading ? "Generating..." : "Generate Video"}
      </button>

      {status && <p>Status: {status}</p>}

      {videoUrl && (
        <video src={videoUrl} controls width="400" />
      )}
    </main>
  );
}
