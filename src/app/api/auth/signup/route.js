import { dbConnect } from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // allow your React app
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle CORS preflight request
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    const db = await dbConnect();
    const users = db.collection("users");

    const exist = await users.findOne({ email });
    if (exist) {
      return new Response(
        JSON.stringify({ error: "User already exists" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    await users.insertOne({
      name,
      email,
      password: hashed,
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({ message: "Signup successful" }),
      { status: 200, headers: corsHeaders }
    );
  } catch (e) {
    console.error("SIGNUP ERROR:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}
