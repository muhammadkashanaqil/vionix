// middleware.js (root of Next.js backend)
import { NextResponse } from "next/server";

const allowedOrigin = "*"; // or set your React URL: "http://localhost:5173"

export function middleware(req) {
  const origin = req.headers.get("origin") || allowedOrigin;

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        // "Access-Control-Allow-Credentials": "true", // if using cookies
      },
    });
  }

  // Let the request go to the route handler
  const res = NextResponse.next();

  // Add CORS headers to ALL API responses
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  // res.headers.set("Access-Control-Allow-Credentials", "true"); // if needed

  return res;
}

// Apply only to API routes
export const config = {
  matcher: "/api/auth/:path*",
};
