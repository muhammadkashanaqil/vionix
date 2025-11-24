export async function GET() {
  return new Response(
    JSON.stringify({ message: "Logged out" }),
    {
      status: 200,
      headers: {
        "Set-Cookie": `token=; HttpOnly; Path=/; Max-Age=0`,
        "Content-Type": "application/json",
      },
    }
  );
}
