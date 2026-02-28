"use client";

import { useEffect, useState, useRef } from "react";
const todayGlobal = new Date();


const STATUS_COLOR: any = {
  "": "bg-transparent",
  full: "bg-green-500 text-white",
  late: "bg-yellow-400 text-black",
  half: "bg-orange-500 text-white",
  absent: "bg-red-600 text-white",
};

export default function AttendancePage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [activeCell, setActiveCell] = useState<{
    staffId: string;
    day: number;
  } | null>(null);

  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const popupRef = useRef<HTMLDivElement | null>(null);

  const daysInMonth = new Date(year, month, 0).getDate();

  const currentMonth = todayGlobal.getMonth() + 1;
  const currentYear = todayGlobal.getFullYear();

  const isFutureMonth =
    year > currentYear ||
    (year === currentYear && month > currentMonth);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (isFutureMonth) {
      setIsLocked(true);
      return;
    }

    fetchAttendance();
    fetchHolidays();

    // check if salary month is locked
    fetch(`/api/staff/salary/status?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((d) => {
        setIsLocked(d?.locked || false);
      })
      .catch(() => setIsLocked(false));
  }, [month, year]);

  const fetchStaff = async () => {
    const res = await fetch("/api/staff");
    const data = await res.json();
    setStaff(data);
  };

  const fetchAttendance = async () => {
    const res = await fetch(
      `/api/staff/attendance?month=${month}&year=${year}`
    );
    const data = await res.json();
    setAttendance(data);
  };

  const fetchHolidays = async () => {
    const res = await fetch(
      `/api/staff/holidays?month=${month}&year=${year}`
    );
    const data = await res.json();
    setHolidays(data);
  };

  const isMonday = (day: number) => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 1;
  };

  const isHoliday = (day: number) => {
    return holidays.some((h) => {
      const d = new Date(h.date);
      return d.getDate() === day;
    });
  };

  const getExistingStatus = (staffId: string, day: number) => {
    const record = attendance.find(
      (a) => String(a.staffId) === String(staffId)
    );

    return record?.records?.[day]?.status || "";
  };

  const updateAttendance = async (
    staffId: string,
    day: number,
    status: string
  ) => {
    if (isFutureMonth) {
      alert("Cannot mark attendance for future month.");
      return;
    }

    if (isLocked) {
      alert("Salary month locked. Attendance editing disabled.");
      return;
    }

    // optimistic UI update
    setAttendance((prev: any[]) => {
      const existing = prev.find(
        (a) => String(a.staffId) === String(staffId)
      );

      if (existing) {
        return prev.map((a) => {
          if (String(a.staffId) !== String(staffId)) return a;

          return {
            ...a,
            records: {
              ...a.records,
              [day]: { status },
            },
          };
        });
      }

      // if no record exists for that staff
      return [
        ...prev,
        {
          staffId,
          month,
          year,
          records: {
            [day]: { status },
          },
        },
      ];
    });

    // backend save
    await fetch("/api/staff/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId,
        day,
        month,
        year,
        status,
      }),
    });

    setActiveCell(null);
    setPopupPosition(null);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && popupRef.current.contains(e.target as Node)) {
        return; // click inside popup
      }

      setActiveCell(null);
      setPopupPosition(null);
    };

    if (activeCell) {
      window.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeCell]);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">
        Monthly Attendance
      </h1>

      {/* Legend on TOP */}
      <div className="flex gap-6 mb-4 text-sm">
        <span className="text-green-400">F = Full</span>
        <span className="text-yellow-400">L = Late</span>
        <span className="text-orange-400">H = Half</span>
        <span className="text-red-400">A = Absent</span>
        <span className="text-gray-400">M = Monday/Holiday</span>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <select
          value={month}
          onChange={(e) => {
            const selectedMonth = Number(e.target.value);

            if (
              year === currentYear &&
              selectedMonth > currentMonth
            ) {
              alert("Future months are locked until month starts.");
              return;
            }

            setMonth(selectedMonth);
          }}
          className="bg-[#111827] border border-gray-700 p-2 rounded"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>
              {new Date(0, i).toLocaleString("default", {
                month: "long",
              })}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => {
            const selectedYear = Number(e.target.value);

            if (selectedYear > currentYear) {
              alert("Future year not allowed.");
              return;
            }

            setYear(selectedYear);
          }}
          className="bg-[#111827] border border-gray-700 p-2 rounded"
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* DARK GRID */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-[#111827]">
            <tr>
              <th className="p-3 border border-gray-700 sticky left-0 bg-[#111827] z-10">
                Staff
              </th>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <th
                  key={i}
                  className="p-2 border border-gray-700 text-gray-300"
                >
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {staff.map((s) => (
              <tr key={s._id} className="bg-[#0f172a]">
                <td className="p-3 border border-gray-700 font-medium sticky left-0 bg-[#0f172a]">
                  {s.name}
                </td>

                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const disabled =
                    isMonday(day) || isHoliday(day);

                  const currentStatus = getExistingStatus(
                    s._id,
                    day
                  );

                  return (
                    <td
                      key={day}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (disabled || isFutureMonth || isLocked) return;

                        const rect = (e.target as HTMLElement).getBoundingClientRect();

                        setPopupPosition({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });

                        setActiveCell({ staffId: s._id, day });
                      }}
                      className={`relative p-2 border border-gray-700 text-center cursor-pointer
                        ${
                          disabled
                            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                            : STATUS_COLOR[currentStatus]
                        }`}
                    >
                      {disabled
                        ? "M"
                        : currentStatus
                        ? currentStatus[0].toUpperCase()
                        : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeCell && popupPosition && (
        <div
          ref={popupRef}
          className="fixed z-[9999] bg-[#0f172a] border border-gray-600 rounded-lg shadow-2xl p-3"
          style={{
            top: popupPosition.y - 10,
            left: popupPosition.x,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex flex-col gap-2 text-sm min-w-[120px]">

            <button
              onClick={() => updateAttendance(activeCell.staffId, activeCell.day, "full")}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white"
            >
              Full
            </button>

            <button
              onClick={() => updateAttendance(activeCell.staffId, activeCell.day, "late")}
              className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-black"
            >
              Late
            </button>

            <button
              onClick={() => updateAttendance(activeCell.staffId, activeCell.day, "half")}
              className="bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded text-white"
            >
              Half
            </button>

            <button
              onClick={() => updateAttendance(activeCell.staffId, activeCell.day, "absent")}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
            >
              Absent
            </button>

            <button
              onClick={() => updateAttendance(activeCell.staffId, activeCell.day, "")}
              className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded text-white"
            >
              Clear
            </button>

          </div>
        </div>
      )}
    </div>
  );
}