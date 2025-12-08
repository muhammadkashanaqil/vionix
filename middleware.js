// Enable CORS for all API routes
export function middleware(req) {
  const origin = req.headers.get("origin") || "*";

  const response = new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });

  // If OPTIONS request (preflight)
  if (req.method === "OPTIONS") {
    return response;
  }

  return response;
}

// Apply middleware only to API routes
export const config = {
  matcher: "/api/:path*",
};
