// import jwt from "jsonwebtoken";

// export async function GET(req) {
//   try {
//     const cookie = req.headers.get("cookie") || "";
//     const token = cookie.split("token=")[1];

//     if (!token) {
//       return Response.json({ error: "Not logged in" }, { status: 401 });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     return Response.json({
//       message: "Welcome, user authenticated!",
//       user: decoded,
//     });
//   } catch (e) {
//     return Response.json({ error: "Invalid token" }, { status: 401 });
//   }
// }


// app/api/profile/route.js
// import { NextResponse } from "next/server";
// import { dbConnect } from "@/app/lib/mongodb";
// import jwt from "jsonwebtoken";
// import { ObjectId } from "mongodb";

// export async function GET(req) {
//   try {
//     // ✅ Read token from cookies attached to the request
//     const token = req.cookies.get("token")?.value;

//     if (!token) {
//       return NextResponse.json(
//         { error: "Not authenticated" },
//         { status: 401 }
//       );
//     }

//     if (!process.env.JWT_SECRET) {
//       throw new Error("JWT_SECRET is not set");
//     }

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch {
//       return NextResponse.json(
//         { error: "Invalid or expired token" },
//         { status: 401 }
//       );
//     }

//     const db = await dbConnect();
//     const users = db.collection("users");

//     const user = await users.findOne({ _id: new ObjectId(decoded.id) });

//     if (!user) {
//       return NextResponse.json(
//         { error: "User not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(
//       {
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           createdAt: user.createdAt,
//         },
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("PROFILE ERROR:", err);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }


// app/api/profile/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";

export async function GET(req) {
  try {
    const db = await dbConnect();
    const user = await getUserFromRequest(req, db);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          credits: user.credits ?? 0,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
