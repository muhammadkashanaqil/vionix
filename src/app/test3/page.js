// "use client";

// import { useState } from "react";

// export default function Test3Page() {
//   const [file, setFile] = useState(null);
//   const [prompt, setPrompt] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [status, setStatus] = useState("");
//   const [videoUrl, setVideoUrl] = useState("");

//   async function handleGenerate() {
//     try {
//       setLoading(true);
//       setStatus("");
//       setVideoUrl("");

//       if (!file) throw new Error("Please choose a file");
//       if (!prompt.trim()) throw new Error("Please enter prompt");

//       // 1) presign
//       const presignRes = await fetch("/api/uploads/presign", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           fileName: file.name,
//           contentType: file.type,
//         }),
//       });

//       const presign = await presignRes.json();
//       if (!presignRes.ok) throw new Error(presign.error || "Presign failed");

//       // 2) upload to S3 (IMPORTANT: only Content-Type header)
//       const uploadRes = await fetch(presign.uploadUrl, {
//         method: "PUT",
//         headers: { "Content-Type": file.type },
//         body: file,
//       });

//       if (!uploadRes.ok) {
//         const text = await uploadRes.text().catch(() => "");
//         throw new Error("S3 upload failed: " + (text || uploadRes.status));
//       }

//       setStatus("Uploaded. Creating job...");

//       // 3) create job (credits deduct here)
//       const createRes = await fetch("/api/ads/create", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           prompt,
//           imageKey: presign.key,
//           imageUrl: presign.publicUrl,
//         }),
//       });

//       const job = await createRes.json();
//       if (!createRes.ok) throw new Error(job.error || "Create job failed");

//       setStatus("Processing...");

//       // 4) poll
//       const url = await pollJob(job.jobId);
//       setVideoUrl(url);
//       setStatus("Completed ✅");
//     } catch (e) {
//       setStatus(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function pollJob(jobId) {
//     while (true) {
//       const res = await fetch(`/api/ads/${jobId}`);
//       const data = await res.json();

//       if (data.status === "completed") return data.videoUrl;
//       if (data.status === "failed") throw new Error(data.error || "Failed");

//       await new Promise((r) => setTimeout(r, 2000));
//     }
//   }

//   return (
//     <div style={{ padding: 24 }}>
//       <h1>Create Video Ad (Test)</h1>

//       <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
//       <br /><br />

//       <textarea
//         rows={6}
//         style={{ width: 600 }}
//         value={prompt}
//         onChange={(e) => setPrompt(e.target.value)}
//         placeholder="Describe your ad..."
//       />
//       <br /><br />

//       <button disabled={loading} onClick={handleGenerate}>
//         {loading ? "Generating..." : "Generate"}
//       </button>

//       <p style={{ color: status.includes("failed") ? "red" : "black" }}>{status}</p>

//       {videoUrl && (
//         <video src={videoUrl} controls style={{ width: 600, marginTop: 16 }} />
//       )}
//     </div>
//   );
// }





// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";

// export default function Test3Page() {
//   const [file, setFile] = useState(null);
//   const [prompt, setPrompt] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [status, setStatus] = useState("");
//   const [jobId, setJobId] = useState("");
//   const [videoUrl, setVideoUrl] = useState("");

//   const [credits, setCredits] = useState(null);

//   const stopPollingRef = useRef(false);

//   // Simple helper to display nicer error text
//   function asMessage(err) {
//     if (!err) return "Unknown error";
//     if (typeof err === "string") return err;
//     return err.message || "Unknown error";
//   }

//   async function refreshCredits() {
//     try {
//       const res = await fetch("/api/credits", { credentials: "include" });
//       const data = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         // Not logged in or server issue
//         setCredits(null);
//         return;
//       }
//       setCredits(data.credits ?? 0);
//     } catch {
//       setCredits(null);
//     }
//   }

//   useEffect(() => {
//     refreshCredits();
//     return () => {
//       stopPollingRef.current = true;
//     };
//   }, []);

//   async function handleGenerate() {
//     stopPollingRef.current = false;

//     try {
//       setLoading(true);
//       setStatus("");
//       setVideoUrl("");
//       setJobId("");

//       if (!file) throw new Error("Please choose a file");
//       if (!prompt.trim()) throw new Error("Please enter prompt");

//       // 0) optional: refresh credits on click
//       await refreshCredits();

//       // 1) presign
//       setStatus("Requesting upload URL...");

//       const presignRes = await fetch("/api/uploads/presign", {
//         method: "POST",
//         credentials: "include",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           fileName: file.name,
//           contentType: file.type || "application/octet-stream",
//         }),
//       });

//       const presign = await presignRes.json().catch(() => ({}));
//       if (!presignRes.ok) {
//         throw new Error(presign.error || "Presign failed");
//       }

//       // 2) upload to S3 (IMPORTANT: only Content-Type header)
//       setStatus("Uploading to S3...");

//       const uploadRes = await fetch(presign.uploadUrl, {
//         method: "PUT",
//         headers: { "Content-Type": file.type || "application/octet-stream" },
//         body: file,
//       });

//       if (!uploadRes.ok) {
//         const text = await uploadRes.text().catch(() => "");
//         throw new Error("S3 upload failed: " + (text || uploadRes.status));
//       }

//       // 3) create job (credits deduct here + n8n triggered server-side)
//       setStatus("Uploaded ✅ Creating job...");

//       const createRes = await fetch("/api/ads/create", {
//         method: "POST",
//         credentials: "include",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           prompt: prompt.trim(),
//           imageKey: presign.key,
//           imageUrl: presign.publicUrl,
//         }),
//       });

//       const job = await createRes.json().catch(() => ({}));
//       if (!createRes.ok) {
//         throw new Error(job.error || `Create job failed (${createRes.status})`);
//       }

//       if (!job.jobId) throw new Error("No jobId returned from server.");

//       setJobId(job.jobId);

//       // update credits UI
//       if (typeof job.creditsRemaining === "number") {
//         setCredits(job.creditsRemaining);
//       } else {
//         await refreshCredits();
//       }

//       // 4) poll
//       setStatus("Processing... (polling job status)");
//       const url = await pollJob(job.jobId);

//       if (!url) throw new Error("Job completed but no videoUrl returned.");

//       setVideoUrl(url);
//       setStatus("Completed ✅");
//     } catch (e) {
//       setStatus(asMessage(e));
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function pollJob(id) {
//     // Poll up to 10 minutes (300 * 2s)
//     const maxAttempts = 300;

//     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//       if (stopPollingRef.current) {
//         throw new Error("Polling stopped.");
//       }

//       const res = await fetch(`/api/ads/${id}`, {
//         method: "GET",
//         credentials: "include",
//       });

//       const data = await res.json().catch(() => ({}));

//       // If auth breaks or bad id, stop immediately
//       if (!res.ok) {
//         throw new Error(data.error || `Polling failed (${res.status})`);
//       }

//       // Expected: queued | processing | completed | failed
//       if (data.status === "completed") return data.videoUrl;
//       if (data.status === "failed") throw new Error(data.error || "Job failed");

//       // Keep UI updated
//       setStatus(
//         `Processing... (${data.status || "waiting"}) • attempt ${attempt}/${maxAttempts}`
//       );

//       await new Promise((r) => setTimeout(r, 2000));
//     }

//     throw new Error("Timed out waiting for job completion.");
//   }

//   function handleStop() {
//     stopPollingRef.current = true;
//     setLoading(false);
//     setStatus("Stopped.");
//   }

//   const canGenerate = useMemo(() => {
//     return !loading && file && prompt.trim();
//   }, [loading, file, prompt]);

//   return (
//     <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
//       <h1 style={{ marginBottom: 6 }}>Create Video Ad (Test)</h1>

//       <div style={{ marginBottom: 16, opacity: 0.85 }}>
//         <div>
//           <b>Credits:</b>{" "}
//           {credits === null ? (
//             <span>— (not loaded / not logged in)</span>
//           ) : (
//             <span>{credits}</span>
//           )}
//         </div>
//         {jobId ? (
//           <div style={{ marginTop: 6 }}>
//             <b>Job ID:</b> <code>{jobId}</code>
//           </div>
//         ) : null}
//       </div>

//       <div style={{ marginBottom: 12 }}>
//         <input
//           type="file"
//           accept="image/*"
//           onChange={(e) => setFile(e.target.files?.[0] || null)}
//           disabled={loading}
//         />
//       </div>

//       <div style={{ marginBottom: 12 }}>
//         <textarea
//           rows={6}
//           style={{ width: 650, maxWidth: "100%" }}
//           value={prompt}
//           onChange={(e) => setPrompt(e.target.value)}
//           placeholder="Describe your ad... (e.g., 'Make a cinematic ad for this product, bold headline, modern vibe')"
//           disabled={loading}
//         />
//       </div>

//       <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
//         <button disabled={!canGenerate} onClick={handleGenerate}>
//           {loading ? "Generating..." : "Generate"}
//         </button>

//         <button disabled={!loading} onClick={handleStop}>
//           Stop
//         </button>

//         <button disabled={loading} onClick={refreshCredits}>
//           Refresh Credits
//         </button>
//       </div>

//       <p
//         style={{
//           marginTop: 14,
//           whiteSpace: "pre-wrap",
//           color:
//             status.toLowerCase().includes("error") ||
//             status.toLowerCase().includes("failed") ||
//             status.toLowerCase().includes("not ")
//               ? "crimson"
//               : "black",
//         }}
//       >
//         {status}
//       </p>

//       {videoUrl ? (
//         <div style={{ marginTop: 16 }}>
//           <div style={{ marginBottom: 8 }}>
//             <b>Result:</b>
//           </div>

//           <video
//             src={videoUrl}
//             controls
//             style={{ width: 650, maxWidth: "100%", border: "1px solid #ddd" }}
//           />

//           <div style={{ marginTop: 8 }}>
//             <a href={videoUrl} target="_blank" rel="noreferrer">
//               Open video in new tab
//             </a>
//           </div>
//         </div>
//       ) : null}
//     </div>
//   );
// }



"use client";

import { useEffect, useMemo, useState } from "react";

export default function Test3Page() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [credits, setCredits] = useState(null);

  // Simple helper to display nicer error text
  function asMessage(err) {
    if (!err) return "Unknown error";
    if (typeof err === "string") return err;
    return err.message || "Unknown error";
  }

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

  useEffect(() => {
    refreshCredits();
  }, []);

  async function handleGenerate() {
    try {
      setLoading(true);
      setStatus("Processing...");
      setVideoUrl("");
      setJobId("");

      if (!file) throw new Error("Please choose a file");
      if (!prompt.trim()) throw new Error("Please enter prompt");

      await refreshCredits(); // Optional: refresh on click

      // Send FormData directly (no S3)
      const form = new FormData();
      form.append("prompt", prompt.trim());
      form.append("image", file);

      const createRes = await fetch("/api/ads/create", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const job = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(job.error || `Create failed (${createRes.status})`);
      }

      if (!job.jobId) throw new Error("No jobId returned.");
      setJobId(job.jobId);

      // Update credits UI
      if (typeof job.creditsRemaining === "number") {
        setCredits(job.creditsRemaining);
      } else {
        await refreshCredits();
      }

      if (!job.videoUrl) throw new Error("No video URL returned from n8n.");

      setVideoUrl(job.videoUrl);
      setStatus("Completed ✅");
    } catch (e) {
      setStatus(`Error: ${asMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = useMemo(() => {
    return !loading && file && prompt.trim();
  }, [loading, file, prompt]);

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: 6 }}>Create Video Ad (Test)</h1>

      <div style={{ marginBottom: 16, opacity: 0.85 }}>
        <div>
          <b>Credits:</b>{" "}
          {credits === null ? (
            <span>— (not loaded / not logged in)</span>
          ) : (
            <span>{credits}</span>
          )}
        </div>
        {jobId ? (
          <div style={{ marginTop: 6 }}>
            <b>Job ID:</b> <code>{jobId}</code>
          </div>
        ) : null}
      </div>

      <div style={{ marginBottom: 12 }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={loading}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <textarea
          rows={6}
          style={{ width: 650, maxWidth: "100%" }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your ad... (e.g., 'Make a cinematic ad for this product, bold headline, modern vibe')"
          disabled={loading}
        />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button disabled={!canGenerate} onClick={handleGenerate}>
          {loading ? "Generating..." : "Generate"}
        </button>

        <button disabled={loading} onClick={refreshCredits}>
          Refresh Credits
        </button>
      </div>

      <p
        style={{
          marginTop: 14,
          whiteSpace: "pre-wrap",
          color: status.toLowerCase().includes("error") || status.toLowerCase().includes("failed")
            ? "crimson"
            : "black",
        }}
      >
        {status}
      </p>

      {videoUrl ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <b>Result:</b>
          </div>

          <video
            src={videoUrl}
            controls
            style={{ width: 650, maxWidth: "100%", border: "1px solid #ddd" }}
          />

          <div style={{ marginTop: 8 }}>
            <a href={videoUrl} target="_blank" rel="noreferrer">
              Open video in new tab
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

