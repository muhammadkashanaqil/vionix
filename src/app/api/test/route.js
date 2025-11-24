let mydata = null;
 // use let

export async function POST(request) {
  const data = await request.json();
  mydata = data; // now it works

  return Response.json({
    message: "POST request received!",
    yourData: data
  });
}

export async function GET() {
  return Response.json({
    status: "success",
    message: "This is a GET request",
    yourData: mydata
  });
}
