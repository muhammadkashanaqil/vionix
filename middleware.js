// middleware.js (at project root)
import { NextResponse } from "next/server";

const ALLOWED_ORIGIN = "*"; // or "http://localhost:5173" for your React app

export function middleware(request) {
  const origin = request.headers.get("origin") || ALLOWED_ORIGIN;

  // Log to verify middleware runs
  console.log("[middleware] hit:", request.method, request.nextUrl.pathname);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        // "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  // Let the request continue
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
  // res.headers.set("Access-Control-Allow-Credentials", "true");

  return res;
}

// Apply only to /api routes
export const config = {
  matcher: ["/api/:path*"],
};
