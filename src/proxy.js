// proxy.js (Next.js 15+)
// CORS implementation using Proxy API
import { NextResponse } from "next/server";

const allowedOrigins = ["http://localhost:3000", "https://vioniix.vercel.app"];
// Add more allowed origins depending on your frontend URLs

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function proxy(request) {
  const origin = request.headers.get("origin") ?? "";

  const isAllowed = allowedOrigins.includes(origin);
  const isPreflight = request.method === "OPTIONS";

  // 🔥 Handle preflight requests FIRST
  if (isPreflight) {
    const headers = {
      ...(isAllowed && { "Access-Control-Allow-Origin": origin }),
      ...corsOptions,
    };

    return new Response(null, { status: 204, headers });
  }

  // 🔥 Normal requests (GET, POST, etc.)
  const response = NextResponse.next();

  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  for (const [key, value] of Object.entries(corsOptions)) {
    response.headers.set(key, value);
  }

  return response;
}

// Only run Proxy on API routes
export const config = {
  matcher: "/api/:path*",
};
