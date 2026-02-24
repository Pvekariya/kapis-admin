import { getDb } from "@/lib/mongodb";

export async function notify(type: string, message: string) {
  const db = await getDb();

  await db.collection("notifications").insertOne({
    type,
    message,
    createdAt: new Date(),
  });
}