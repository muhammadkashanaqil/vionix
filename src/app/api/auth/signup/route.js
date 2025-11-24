import { dbConnect } from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    const db = await dbConnect();
    const users = db.collection("users");

    const exist = await users.findOne({ email });
    if (exist) {
      return Response.json({ error: "User already exists" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await users.insertOne({
      name,
      email,
      password: hashed,
      createdAt: new Date(),
    });

    return Response.json({ message: "Signup successful" });
  } catch (e) {
    console.error("SIGNUP ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
