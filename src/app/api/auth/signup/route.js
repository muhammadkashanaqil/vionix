// import { dbConnect } from "@/app/lib/mongodb";
// import bcrypt from "bcryptjs";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*", // allow your React app
//   "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
// };

// // Handle CORS preflight request
// export async function OPTIONS() {
//   return new Response(null, { status: 204, headers: corsHeaders });
// }

// export async function POST(req) {
//   try {
//     const { name, email, password } = await req.json();

//     const db = await dbConnect();
//     const users = db.collection("users");

//     const exist = await users.findOne({ email });
//     if (exist) {
//       return new Response(
//         JSON.stringify({ error: "User already exists" }),
//         { status: 400, headers: corsHeaders }
//       );
//     }

//     const hashed = await bcrypt.hash(password, 10);

//     await users.insertOne({
//       name,
//       email,
//       password: hashed,
//       createdAt: new Date(),
//     });

//     return new Response(
//       JSON.stringify({ message: "Signup successful" }),
//       { status: 200, headers: corsHeaders }
//     );
//   } catch (e) {
//     console.error("SIGNUP ERROR:", e);
//     return new Response(
//       JSON.stringify({ error: e.message }),
//       { status: 500, headers: corsHeaders }
//     );
//   }
// }



// import { dbConnect } from "@/app/lib/mongodb";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { NextResponse } from "next/server";

// export async function POST(req) {
//   try {
//     const { name, email, password } = await req.json();

//     if (!name || !email || !password) {
//       return NextResponse.json({ error: "Missing fields" }, { status: 400 });
//     }

//     const db = await dbConnect();
//     const users = db.collection("users");

//     const exists = await users.findOne({ email });
//     if (exists) {
//       return NextResponse.json({ error: "User already exists" }, { status: 409 });
//     }

//     const hashed = await bcrypt.hash(password, 10);

//     const result = await users.insertOne({
//       name,
//       email,
//       password: hashed,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     const token = jwt.sign(
//       { id: result.insertedId, email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     const res = NextResponse.json({
//       message: "Signup successful",
//       user: { id: result.insertedId, name, email }
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

// app/api/auth/signup/route.js
import { dbConnect } from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = await dbConnect();
    const users = db.collection("users");

    const exists = await users.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await users.insertOne({
      name,
      email,
      password: hashed,
      credits: 0,                 // <-- important for your app
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = jwt.sign(
      { id: result.insertedId, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({
      message: "Signup successful",
      user: { id: result.insertedId, name, email },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
