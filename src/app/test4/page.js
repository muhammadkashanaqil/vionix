"use client";

import { useState } from "react";

<<<<<<< HEAD
// Helper function to extract and convert YouTube watch URLs to embeddable URLs
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  
  // Regex to capture the 11-digit YouTube video ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  
  return null;
}

=======
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2
export default function UploadPage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Create FormData to send to your route.js
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("image", image);

    try {
      const response = await fetch("/api/generate", { // Adjust path to your route.js
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data.n8nResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  // Extract video link if it exists in the response
  const rawVideoUrl = result?.response;
  const embedUrl = getYouTubeEmbedUrl(rawVideoUrl);

=======
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2
  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">n8n Image Generator</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 border p-6 rounded-lg shadow-sm">
        <div>
          <label className="block font-medium mb-1">Prompt</label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded text-black"
            placeholder="Describe what to do..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Image</label>
          <input
            type="file"
            required
            accept="image/*"
            className="w-full"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Processing..." : "Send to n8n"}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="mt-6">
<<<<<<< HEAD
          <h2 className="text-xl font-semibold mb-3">n8n Response:</h2>
          
          {embedUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-green-600 font-medium">✓ Video generated successfully!</p>
              {/* Aspect-ratio box keeps the player layout responsive and clean */}
              <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg border bg-black">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={embedUrl}
                  title="n8n Response Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          ) : (
            // Fallback block showing raw JSON if the result does not contain a recognizable YouTube URL
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm text-black border">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
=======
          <h2 className="text-xl font-semibold mb-2">n8n Response:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm text-black">
            {JSON.stringify(result, null, 2)}
          </pre>
>>>>>>> e34186f6942822f1cd4b974da3a459e43538c0e2
        </div>
      )}
    </main>
  );
}