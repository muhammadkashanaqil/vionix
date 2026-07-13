// app/api/projects/[id]/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/mongodb";
import { getUserFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(req, { params }) {
  try {
    const db = await dbConnect();
    const user = await getUserFromRequest(req, db);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const projectsCol = db.collection("projects");

    const project = await projectsCol.findOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(user._id),
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(project, { status: 200 });
  } catch (err) {
    console.error("PROJECT GET ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const db = await dbConnect();
    const user = await getUserFromRequest(req, db);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const projectsCol = db.collection("projects");

    await projectsCol.deleteOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(user._id),
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("PROJECT DELETE ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
