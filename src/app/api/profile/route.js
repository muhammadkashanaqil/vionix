import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const token = cookie.split("token=")[1];

    if (!token) {
      return Response.json({ error: "Not logged in" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return Response.json({
      message: "Welcome, user authenticated!",
      user: decoded,
    });
  } catch (e) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }
}
