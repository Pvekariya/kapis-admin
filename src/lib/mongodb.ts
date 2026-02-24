import { MongoClient } from "mongodb";
console.log("URI:", process.env.MONGO_URI);

const uri = process.env.MONGO_URI as string;

if (!uri) {
  throw new Error("Missing MONGO_URI");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!(global as any)._mongoClientPromise) {
  client = new MongoClient(uri);
  (global as any)._mongoClientPromise = client.connect();
}

clientPromise = (global as any)._mongoClientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db("kapis");
}