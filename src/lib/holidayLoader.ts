import Holidays from "date-holidays";
import { getDb } from "./mongodb";

export async function loadIndiaHolidays(year: number) {
  const db = await getDb();

  const existing = await db.collection("holidays").findOne({ year });
  if (existing) return; // already loaded

  const hd = new Holidays("IN");
  const holidayList = hd.getHolidays(year);

  const filtered = holidayList.map((h: any) => ({
    name: h.name,
    date: new Date(h.date),
    year,
    createdAt: new Date(),
  }));

  if (filtered.length > 0) {
    await db.collection("holidays").insertMany(filtered);
  }
}