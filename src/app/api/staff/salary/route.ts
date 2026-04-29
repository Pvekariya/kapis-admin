import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { guardAuth } from "@/lib/auth";

/* =========================
   GET SALARY SUMMARY
========================= */
export async function GET(req: Request) {
  try {
    const unauth = await guardAuth();
    if (unauth) return unauth;

    const db = await getDb();
    const { searchParams } = new URL(req.url);

    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (!month || !year) {
      return NextResponse.json({ error: "Invalid month/year" }, { status: 400 });
    }

    const staff = await db
      .collection("staff")
      .find({ status: "active" })
      .toArray();

    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    const attendance = await db
      .collection("attendance")
      .find({ date: { $gte: startDate, $lte: endDate } })
      .toArray();

    const advances = await db
      .collection("advances")
      .find({ month, year })
      .toArray();

    const salaryLocks = await db
      .collection("salaryLocks")
      .find({ month, year })
      .toArray();

    const totalDaysInMonth = new Date(year, month, 0).getDate();

    const result = staff.map((s: any) => {
      const staffAttendance = attendance.filter(
        (a: any) => String(a.staffId) === String(s._id)
      );

      let workedUnits = 0;

      staffAttendance.forEach((a: any) => {
        const st = String(a.status || "").toUpperCase();

        if (st === "F" || st === "FULL") workedUnits += 1;
        else if (st === "L" || st === "LATE") workedUnits += 0.75;
        else if (st === "H" || st === "HALF") workedUnits += 0.5;
      });

      const monthlySalary = Number(s.monthlySalary) || 0;
      const dailyRate = monthlySalary / totalDaysInMonth;
      const earned = dailyRate * workedUnits;

      const staffAdvances = advances.filter(
        (adv: any) => String(adv.staffId) === String(s._id)
      );

      const totalAdvance = staffAdvances.reduce(
        (sum: number, adv: any) => sum + Number(adv.amount || 0),
        0
      );

      const remaining = earned - totalAdvance;

      const lockRecord = salaryLocks.find(
        (l: any) => String(l.staffId) === String(s._id)
      );

      return {
        staffId: s._id.toString(),
        name: s.name,
        monthlySalary,
        workedUnits,
        earned,
        totalAdvance,
        remaining,
        isLocked: lockRecord?.isLocked || false,
        isPaid: lockRecord?.isPaid || false,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Salary GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* =========================
   LOCK MONTH
========================= */
export async function PUT(req: Request) {
  try {
    const unauth = await guardAuth();
    if (unauth) return unauth;

    const db = await getDb();
    const body = await req.json();

    const { staffId, month, year } = body;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (
      year > currentYear ||
      (year === currentYear && month > currentMonth)
    ) {
      return NextResponse.json(
        { error: "Cannot lock future month" },
        { status: 400 }
      );
    }

    await db.collection("salaryLocks").updateOne(
      { staffId: new ObjectId(staffId), month, year },
      {
        $set: {
          staffId: new ObjectId(staffId),
          month,
          year,
          isLocked: true,
          isPaid: false,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Lock failed" }, { status: 500 });
  }
}

/* =========================
   MARK SALARY PAID
========================= */
export async function POST(req: Request) {
  try {
    const unauth = await guardAuth();
    if (unauth) return unauth;

    const db = await getDb();
    const body = await req.json();

    const { staffId, month, year, amount, paymentMode } = body;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (
      year > currentYear ||
      (year === currentYear && month > currentMonth)
    ) {
      return NextResponse.json(
        { error: "Cannot pay salary for future month" },
        { status: 400 }
      );
    }

    const staff = await db.collection("staff").findOne({
      _id: new ObjectId(staffId),
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    await db.collection("salaryLocks").updateOne(
      { staffId: new ObjectId(staffId), month, year },
      {
        $set: {
          staffId: new ObjectId(staffId),
          month,
          year,
          isLocked: true,
          isPaid: true,
          paidAmount: Number(amount),
          paidDate: new Date(),
        },
      },
      { upsert: true }
    );

    await db.collection("daybook").insertOne({
      type: "expense",
      category: "Salary Payment",
      amount: Number(amount),
      description: `Salary paid to ${staff.name}`,
      paymentMode: paymentMode || "Cash",
      source: "salary",
      date: new Date(),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
