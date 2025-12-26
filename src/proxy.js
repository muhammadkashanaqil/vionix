// // proxy.js (Next.js 15+)
// // CORS implementation using Proxy API
// import { NextResponse } from "next/server";

// const allowedOrigins = "*";
// // Add more allowed origins depending on your frontend URLs

// const corsOptions = {
//   "Access-Control-Allow-Origin":"*",
//   "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
// };

// export function proxy(request) {
//   const origin = request.headers.get("origin") ?? "";

//   const isAllowed = allowedOrigins.includes(origin);
//   const isPreflight = request.method === "OPTIONS";

//   // 🔥 Handle preflight requests FIRST
//   if (isPreflight) {
//     const headers = {
//       ...(isAllowed && { "Access-Control-Allow-Origin": origin }),
//       ...corsOptions,
//     };

//     return new Response(null, { status: 204, headers });
//   }

//   // 🔥 Normal requests (GET, POST, etc.)
//   const response = NextResponse.next();

//   if (isAllowed) {
//     response.headers.set("Access-Control-Allow-Origin", origin);
//   }

//   for (const [key, value] of Object.entries(corsOptions)) {
//     response.headers.set(key, value);
//   }

//   return response;
// }

// // Only run Proxy on API routes
// export const config = {
//   matcher: "/api/:path*",
// };


// proxy.js
// import { NextResponse } from "next/server";

// export function proxy(request) {
//   // Handle preflight
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: {
//         "Access-Control-Allow-Origin": "*",
//         "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
//         "Access-Control-Allow-Headers": "Content-Type, Authorization",
//       },
//     });
//   }

//   const response = NextResponse.next();

//   response.headers.set("Access-Control-Allow-Origin", "*");
//   response.headers.set(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, PATCH, DELETE, OPTIONS"
//   );
//   response.headers.set(
//     "Access-Control-Allow-Headers",
//     "Content-Type, Authorization"
//   );

//   return response;
// }

// export const config = {
//   matcher: "/api/:path*",
// };




// import { NextResponse } from "next/server";

// const baseHeaders = {
//   "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
// };

// export function proxy(request) {
//   const origin = request.headers.get("origin") || "";
//   const pathname = request.nextUrl.pathname;

//   // logout uses cookies → credentials required
//   const needsCredentials = pathname === "/api/auth/logout";

//   // Preflight
//   if (request.method === "OPTIONS") {
//     const headers = {
//       ...baseHeaders,
//       ...(needsCredentials
//         ? {
//             "Access-Control-Allow-Origin": origin,
//             "Access-Control-Allow-Credentials": "true",
//             "Vary": "Origin",
//           }
//         : {
//             "Access-Control-Allow-Origin": "*",
//           }),
//     };

//     return new Response(null, { status: 204, headers });
//   }

//   const response = NextResponse.next();

//   if (needsCredentials) {
//     response.headers.set("Access-Control-Allow-Origin", origin);
//     response.headers.set("Access-Control-Allow-Credentials", "true");
//     response.headers.set("Vary", "Origin");
//   } else {
//     response.headers.set("Access-Control-Allow-Origin", "*");
//   }

//   Object.entries(baseHeaders).forEach(([k, v]) =>
//     response.headers.set(k, v)
//   );

//   return response;
// }

// export const config = {
//   matcher: "/api/:path*",
// };


// proxy.js
// import { NextResponse } from "next/server";

// const ALLOWED_ORIGIN = ["http://localhost:3000","https://vionix-beta.vercel.app/"];

// const corsHeaders = {
//   // "Access-Control-Allow-Origin":"http://localhost:3000",
//   "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
//   "Access-Control-Allow-Credentials": "true",
// };

// export function proxy(request) {
//   const origin = request.headers.get("origin");
//   const isAllowed = origin === ALLOWED_ORIGIN;

//   // ✅ Handle preflight (OPTIONS)
//   if (request.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: {
//         ...(isAllowed && { "Access-Control-Allow-Origin": origin }),
//         ...corsHeaders,
//         "Vary": "Origin",
//       },
//     });
//   }

//   // ✅ Normal requests
//   const response = NextResponse.next();

//   if (isAllowed) {
//     response.headers.set("Access-Control-Allow-Origin", origin);
//     response.headers.set("Access-Control-Allow-Credentials", "true");
//     response.headers.set("Vary", "Origin");
//   }

//   response.headers.set(
//     "Access-Control-Allow-Methods",
//     corsHeaders["Access-Control-Allow-Methods"]
//   );
//   response.headers.set(
//     "Access-Control-Allow-Headers",
//     corsHeaders["Access-Control-Allow-Headers"]
//   );

//   return response;
// }

// // ✅ Apply only to API routes
// export const config = {
//   matcher: "/api/:path*",
// };


import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://vionix-beta.vercel.app", // ✅ no trailing slash
];

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export function proxy(request) {
  const origin = request.headers.get("origin");
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin); // ✅ FIX

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...(isAllowed ? { "Access-Control-Allow-Origin": origin } : {}),
        ...corsHeaders,
        Vary: "Origin",
      },
    });
  }

  const response = NextResponse.next();

  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }

  response.headers.set("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"]);
  response.headers.set("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"]);

  return response;
}

export const config = { matcher: "/api/:path*" };
