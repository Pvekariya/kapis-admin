import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI as string;

if (!uri) {
  throw new Error(
    "Missing MONGO_URI environment variable. Add it to .env.local"
  );
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In dev, reuse the connection across hot reloads
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, always create a fresh promise
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(dbName = "kapis") {
  const client = await clientPromise;
  return client.db(dbName);
}

export { clientPromise };