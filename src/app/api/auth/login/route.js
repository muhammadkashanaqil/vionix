// import { dbConnect } from "@/app/lib/mongodb";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export async function POST(req) {
//   try {
//     const { email, password } = await req.json();
//     const db = await dbConnect();
//     const users = db.collection("users");

//     const user = await users.findOne({ email });

//     if (!user) {
//       return Response.json({ error: "User not found" }, { status: 404 });
//     }

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) {
//       return Response.json({ error: "Wrong password" }, { status: 401 });
//     }

//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return new Response(
//       JSON.stringify({ message: "Login successful" }),
//       {
//         status: 200,
//         headers: {
//           "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=604800; Secure; SameSite=Strict`,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//   } catch (e) {
//     return Response.json({ error: e.message }, { status: 500 });
//   }
// }






// import { dbConnect } from "@/app/lib/mongodb";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { NextResponse } from "next/server";

// export async function POST(req) {
//   try {
//     const { email, password } = await req.json();

//     if (!email || !password) {
//       return NextResponse.json({ error: "Missing fields" }, { status: 400 });
//     }

//     const db = await dbConnect();
//     const users = db.collection("users");

//     const user = await users.findOne({ email });
//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) {
//       return NextResponse.json({ error: "Invalid password" }, { status: 401 });
//     }

//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     const res = NextResponse.json({
//       message: "Login successful",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email
//       }
//     });

//     res.cookies.set("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       path: "/",
//       maxAge: 60 * 60 * 24 * 7,
//     });

//     return res;
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

import { dbConnect } from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = await dbConnect();
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

    // ✅ FIXED COOKIE SETTINGS
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: true,        // MUST be true
      sameSite: "none",    // MUST be "none" for cross-origin
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

