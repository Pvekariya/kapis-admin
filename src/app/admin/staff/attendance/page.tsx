"use client";

import { useEffect, useRef, useState } from "react";

const STATUS_COLOR: Record<string, string> = {
  full:   "var(--green)",
  late:   "var(--amber)",
  half:   "#f97316",
  absent: "var(--red)",
};

const STATUS_BG: Record<string, string> = {
  full:   "var(--green-dim)",
  late:   "var(--amber-dim)",
  half:   "rgba(249,115,22,0.14)",
  absent: "var(--red-dim)",
};

const todayGlobal = new Date();

export default function AttendancePage() {
  const today = new Date();
  const [month, setMonth]         = useState(today.getMonth() + 1);
  const [year, setYear]           = useState(today.getFullYear());
  const [staff, setStaff]         = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [holidays, setHolidays]   = useState<any[]>([]);
  const [isLocked, setIsLocked]   = useState(false);
  const [activeCell, setActiveCell] = useState<{ staffId:string; day:number }|null>(null);
  const [popupPos, setPopupPos]   = useState<{ x:number; y:number }|null>(null);
  const popupRef                  = useRef<HTMLDivElement>(null);

  const daysInMonth    = new Date(year, month, 0).getDate();
  const currentMonth   = todayGlobal.getMonth() + 1;
  const currentYear    = todayGlobal.getFullYear();
  const isFutureMonth  = year > currentYear || (year === currentYear && month > currentMonth);

  useEffect(() => {
    fetch("/api/staff", { credentials:"include" })
      .then(r => r.json()).then(d => setStaff(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (isFutureMonth) { setIsLocked(true); return; }
    Promise.all([
      fetch(`/api/staff/attendance?month=${month}&year=${year}`, { credentials:"include" }).then(r => r.json()),
      fetch(`/api/staff/holidays?month=${month}&year=${year}`, { credentials:"include" }).then(r => r.json()),
      fetch(`/api/staff/salary/status?month=${month}&year=${year}`, { credentials:"include" }).then(r => r.json()),
    ]).then(([att, hol, lock]) => {
      setAttendance(Array.isArray(att) ? att : []);
      setHolidays(Array.isArray(hol) ? hol : []);
      setIsLocked(lock?.locked || false);
    }).catch(() => {});
  }, [month, year]); // eslint-disable-line

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setActiveCell(null); setPopupPos(null);
      }
    };
    if (activeCell) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [activeCell]);

  const isMonday  = (day: number) => new Date(year, month-1, day).getDay() === 1;
  const isHoliday = (day: number) => holidays.some(h => new Date(h.date).getDate() === day);

  const getStatus = (staffId: string, day: number) => {
    const rec = attendance.find(a => String(a.staffId) === String(staffId));
    return rec?.records?.[day]?.status || "";
  };

  const markAttendance = async (staffId: string, day: number, status: string) => {
    if (isFutureMonth || isLocked) return;
    setAttendance(prev => {
      const existing = prev.find(a => String(a.staffId) === String(staffId));
      if (existing) {
        return prev.map(a => String(a.staffId) !== String(staffId) ? a : {
          ...a, records: { ...a.records, [day]: { status } },
        });
      }
      return [...prev, { staffId, month, year, records: { [day]: { status } } }];
    });
    await fetch("/api/staff/attendance", {
      method:"POST", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ staffId, day, month, year, status }),
    });
    setActiveCell(null); setPopupPos(null);
  };

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Monthly Attendance</h1>
        <div style={{ display:"flex", gap:8 }}>
          <select className="input" value={month}
            onChange={e => {
              const m = Number(e.target.value);
              if (year === currentYear && m > currentMonth) return;
              setMonth(m);
            }} style={{ maxWidth:140 }}>
            {Array.from({ length:12 }, (_,i) => (
              <option key={i} value={i+1}>
                {new Date(0,i).toLocaleString("default",{ month:"long" })}
              </option>
            ))}
          </select>
          <select className="input" value={year}
            onChange={e => {
              const y = Number(e.target.value);
              if (y > currentYear) return;
              setYear(y);
            }} style={{ maxWidth:100 }}>
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:14, marginBottom:16, flexWrap:"wrap" }}>
        {[
          ["Full",   "var(--green)"],
          ["Late",   "var(--amber)"],
          ["Half",   "#f97316"],
          ["Absent", "var(--red)"],
          ["Mon/Holiday", "var(--text-3)"],
        ].map(([label, color]) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }} />
            <span style={{ fontSize:12, color:"var(--text-2)" }}>{label}</span>
          </div>
        ))}
        {isLocked && <span className="badge badge-amber">Month Locked</span>}
      </div>

      {/* Grid */}
      <div className="g-table" style={{ overflowX:"auto" }}>
        <table style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ minWidth:130, position:"sticky", left:0, background:"var(--bg-3)", zIndex:10 }}>
                Staff
              </th>
              {Array.from({ length:daysInMonth }, (_, i) => {
                const day = i + 1;
                const disabled = isMonday(day) || isHoliday(day);
                return (
                  <th key={day} style={{
                    minWidth:32, textAlign:"center", padding:"11px 4px",
                    color: disabled ? "var(--text-4)" : "var(--text-3)",
                  }}>
                    {day}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s._id}>
                <td style={{ fontWeight:500, position:"sticky", left:0, background:"var(--bg-2)", zIndex:5, borderRight:"1px solid var(--border-2)" }}>
                  {s.name}
                </td>
                {Array.from({ length:daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const disabled = isMonday(day) || isHoliday(day);
                  const status   = getStatus(s._id, day);

                  return (
                    <td
                      key={day}
                      style={{
                        textAlign:"center",
                        padding:"8px 3px",
                        cursor: (disabled || isFutureMonth || isLocked) ? "not-allowed" : "pointer",
                        background: disabled ? "rgba(0,0,0,0.12)" : status ? STATUS_BG[status] : "transparent",
                        transition:"background 0.12s",
                        fontSize:11,
                        fontWeight:600,
                        color: disabled ? "var(--text-4)" : status ? STATUS_COLOR[status] : "transparent",
                      }}
                      onClick={e => {
                        if (disabled || isFutureMonth || isLocked) return;
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setPopupPos({ x: rect.left + rect.width/2, y: rect.top });
                        setActiveCell({ staffId: s._id, day });
                      }}
                    >
                      {disabled ? "M" : status ? status[0].toUpperCase() : "·"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Popup */}
      {activeCell && popupPos && (
        <div ref={popupRef} style={{
          position:"fixed",
          top: popupPos.y - 8,
          left: popupPos.x,
          transform:"translate(-50%,-100%)",
          background:"var(--glass-modal)",
          backdropFilter:"blur(24px)",
          WebkitBackdropFilter:"blur(24px)",
          border:"1px solid var(--border-2)",
          borderRadius:12,
          padding:8,
          boxShadow:"0 16px 48px rgba(0,0,0,0.4)",
          zIndex:9999,
          display:"flex",
          flexDirection:"column",
          gap:4,
          minWidth:110,
        }}>
          {[
            ["Full",   "full",   "var(--green)"],
            ["Late",   "late",   "var(--amber)"],
            ["Half",   "half",   "#f97316"],
            ["Absent", "absent", "var(--red)"],
            ["Clear",  "",       "var(--text-2)"],
          ].map(([label, val, color]) => (
            <button key={label}
              onClick={() => markAttendance(activeCell.staffId, activeCell.day, val)}
              style={{
                background: val ? STATUS_BG[val] || "var(--glass-2)" : "var(--glass-2)",
                border:`1px solid ${val ? STATUS_COLOR[val] || "var(--border)" : "var(--border)"}`,
                borderRadius:8, padding:"7px 12px",
                color: val ? STATUS_COLOR[val] || "var(--text-1)" : "var(--text-2)",
                fontSize:12, fontWeight:600, cursor:"pointer",
                transition:"opacity 0.12s",
              }}>
              {label}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}