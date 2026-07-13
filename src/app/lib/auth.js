// src/app/lib/auth.js
import jwt from "jsonwebtoken";
import { dbConnect } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

export async function getUserFromRequest(req, existingDb) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null; // invalid or expired token
  }

  const db = existingDb || (await dbConnect());
  const users = db.collection("users");

  const user = await users.findOne({ _id: new ObjectId(decoded.id) });

  return user || null;
}
