// // src/lib/mongodb.js
// import { MongoClient } from "mongodb";

// const uri = process.env.MONGODB_URI;

// if (!uri) {
//   throw new Error("Add MONGODB_URI in .env.local");
// }

// // Reuse client in dev to avoid too many connections
// let client;
// let clientPromise;

// if (process.env.NODE_ENV === "development") {
//   if (!global._mongoClientPromise) {
//     client = new MongoClient(uri);
//     global._mongoClientPromise = client.connect();
//   }
//   clientPromise = global._mongoClientPromise;
// } else {
//   client = new MongoClient(uri);
//   clientPromise = client.connect();
// }

// export async function dbConnect() {
//   const client = await clientPromise;
//   // choose whatever DB name you like:
//   const db = client.db("nextjs_auth");
//   return db; // 🔥 IMPORTANT: we return the db
// }

// import { MongoClient } from "mongodb";

// const uri = process.env.MONGODB_URI;

// if (!uri) {
//   throw new Error("Missing MONGODB_URI in environment variables");
// }

// let client;
// let clientPromise;

// if (process.env.NODE_ENV === "development") {
//   // In development mode, use a global variable to preserve connection
//   if (!global._mongoClientPromise) {
//     client = new MongoClient(uri);
//     global._mongoClientPromise = client.connect();
//   }
//   clientPromise = global._mongoClientPromise;
// } else {
//   // In production, create new connection each time
//   client = new MongoClient(uri);
//   clientPromise = client.connect();
// }

// export async function dbConnect() {
//   const client = await clientPromise;
//   return client.db("your_database_name"); // ← change to your actual DB name
// }


// src/lib/mongodb.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is required in .env.local");
}

let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export async function dbConnect() {
  const client = await clientPromise;
  return client.db("nextjs_auth"); // ← your actual database name
}