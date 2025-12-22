// import { NextResponse } from "next/server";

// export async function POST(req) {
//   const token = req.cookies.get("token")?.value;

//   // ❌ No token → user is not logged in
//   if (!token) {
//     return NextResponse.json(
//       { error: "You are not logged in" },
//       { status: 401 }
//     );
//   }

//   // ✅ Token exists → clear it
//   const res = NextResponse.json(
//     { message: "Logged out successfully" },
//     { status: 200 }
//   );

//   res.cookies.set("token", "", {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: "/",
//     maxAge: 0, // delete cookie
//   });

//   return res;
// }
import { NextResponse } from "next/server";

export async function POST(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "You are not logged in" },
      { status: 401 }
    );
  }

  const res = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  // ✅ Correct cookie clearing for cross-origin
  res.cookies.set("token", "", {
    httpOnly: true,
    secure: true,          // MUST be true for SameSite=None
    sameSite: "none",      // MUST be none for cross-origin
    path: "/",
    maxAge: 0,
  });

  return res;
}
