"use client";

import { useState } from "react";

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
          <h2 className="text-xl font-semibold mb-2">n8n Response:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm text-black">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}