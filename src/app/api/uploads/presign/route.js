import { NextResponse } from "next/server";
import crypto from "crypto";
import { createPresignedUploadUrl } from "@/app/lib/aws-s3";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";

export async function POST(req) {
  try {
    const db = await dbConnect();
    const user = await getUserFromRequest(req, db);
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { fileName, contentType } = await req.json();
    if (!fileName || !contentType) {
      return NextResponse.json({ error: "fileName and contentType required" }, { status: 400 });
    }

    const ext = fileName.includes(".") ? fileName.split(".").pop() : "bin";
    const id = crypto.randomBytes(16).toString("hex");
    const key = `uploads/${user._id}/${Date.now()}-${id}.${ext}`;

    const uploadUrl = await createPresignedUploadUrl({ key, contentType });

    const publicBase = process.env.S3_PUBLIC_BASE_URL; // must match bucket + region
    const publicUrl = `${publicBase}/${key}`;

    return NextResponse.json({ uploadUrl, key, publicUrl }, { status: 200 });
  } catch (err) {
    console.error("PRESIGN ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
