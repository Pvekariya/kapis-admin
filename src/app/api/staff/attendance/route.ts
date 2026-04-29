import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { guardAuth } from "@/lib/auth";
import { loadIndiaHolidays } from "@/lib/holidayLoader";

/* =========================
   GET ATTENDANCE (GRID FORMAT)
========================= */
export async function GET(req: Request) {
  try {
    const unauth = await guardAuth();
    if (unauth) return unauth;

    const db = await getDb();
    const { searchParams } = new URL(req.url);

    const monthStr = searchParams.get("month");
    const yearStr = searchParams.get("year");
    const date = searchParams.get("date");

    const month = monthStr && !isNaN(Number(monthStr)) ? Number(monthStr) : undefined;
    const year = yearStr && !isNaN(Number(yearStr)) ? Number(yearStr) : undefined;

    if (year) {
      await loadIndiaHolidays(year);
    }

    const filter: any = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.date = { $gte: start, $lte: end };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(year, month, 0);
      end.setHours(23, 59, 59, 999);

      filter.date = { $gte: start, $lte: end };
    }

    const records = await db.collection("attendance").find(filter).toArray();

    const grouped: any = {};

    records.forEach((item: any) => {
      const staffKey = String(item.staffId);
      const recordDate = new Date(item.date);
      const day = recordDate.getDate();

      if (!grouped[staffKey]) {
        grouped[staffKey] = {
          staffId: staffKey,
          month,
          year,
          records: {},
        };
      }

      grouped[staffKey].records[day] = {
        status: item.status,
        timeIn: item.timeIn || null,
        timeOut: item.timeOut || null,
        workedHours: item.workedHours || 0,
      };
    });

    return NextResponse.json(Object.values(grouped));
  } catch (err: any) {
    console.error("Attendance GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* =========================
   ADD OR UPDATE ATTENDANCE
========================= */
export async function POST(req: Request) {
  try {
    const unauth = await guardAuth();
    if (unauth) return unauth;

    const db = await getDb();
    const body = await req.json();

    const { staffId, status, timeIn, timeOut, date, day, month, year } = body;

    if (!staffId) {
      return NextResponse.json({ error: "Missing staffId" }, { status: 400 });
    }

    let attendanceDate: Date;

    if (date) {
      attendanceDate = new Date(date);
    } else if (day && month && year) {
      attendanceDate = new Date(Number(year), Number(month) - 1, Number(day));
    } else {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    attendanceDate.setHours(0, 0, 0, 0);

    // ❌ Block future month attendance
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const selectedMonth = attendanceDate.getMonth() + 1;
    const selectedYear = attendanceDate.getFullYear();

    if (
      selectedYear > currentYear ||
      (selectedYear === currentYear && selectedMonth > currentMonth)
    ) {
      return NextResponse.json(
        { error: "Cannot mark attendance for future month" },
        { status: 400 }
      );
    }

    // 🔒 Block if salary locked
    const lockRecord = await db.collection("salaryLocks").findOne({
      staffId: new ObjectId(staffId),
      month: selectedMonth,
      year: selectedYear,
      isLocked: true,
    });

    if (lockRecord) {
      return NextResponse.json(
        { error: "Attendance locked for this month" },
        { status: 403 }
      );
    }

    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    let workedHours = 0;

    if (timeIn && timeOut) {
      const inTime = new Date(timeIn);
      const outTime = new Date(timeOut);
      workedHours =
        (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
    }

    const existing = await db.collection("attendance").findOne({
      staffId: new ObjectId(staffId),
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      await db.collection("attendance").updateOne(
        { _id: existing._id },
        {
          $set: {
            status,
            timeIn: timeIn ? new Date(timeIn) : null,
            timeOut: timeOut ? new Date(timeOut) : null,
            workedHours,
          },
        }
      );
    } else {
      await db.collection("attendance").insertOne({
        staffId: new ObjectId(staffId),
        status,
        timeIn: timeIn ? new Date(timeIn) : null,
        timeOut: timeOut ? new Date(timeOut) : null,
        workedHours,
        date: attendanceDate,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Attendance POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
