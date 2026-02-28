"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const statusColors: any = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  closed: "bg-green-500",
};

const months = [
  { label: "All Months", value: "" },
  { label: "January", value: 0 },
  { label: "February", value: 1 },
  { label: "March", value: 2 },
  { label: "April", value: 3 },
  { label: "May", value: 4 },
  { label: "June", value: 5 },
  { label: "July", value: 6 },
  { label: "August", value: 7 },
  { label: "September", value: 8 },
  { label: "October", value: 9 },
  { label: "November", value: 10 },
  { label: "December", value: 11 },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<any>("");
  const [selectedYear, setSelectedYear] = useState<any>("");

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    fetch("/api/admin")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLeads(data);
      });
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    load();
  };

  // 🔎 Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const date = new Date(l.createdAt || l.date);
      const monthMatch =
        selectedMonth === "" || date.getMonth() === Number(selectedMonth);
      const yearMatch =
        selectedYear === "" || date.getFullYear() === Number(selectedYear);
      return monthMatch && yearMatch;
    });
  }, [leads, selectedMonth, selectedYear]);

  // 📅 Available Years from data
  const availableYears = Array.from(
    new Set(
      leads
        .map((l) => {
          const d = new Date(l.createdAt || l.date);
          return isNaN(d.getTime()) ? null : d.getFullYear();
        })
        .filter((y) => y !== null)
    )
  ).sort((a: any, b: any) => b - a);

  // 📤 Export Excel
  const exportExcel = () => {
    const clean = filteredLeads.map((l) => ({
      Name: l.name,
      Email: l.email,
      Mobile: l.phone || "-",
      Product: l.product || "-",
      Status: l.status || "new",
      Date: new Date(l.createdAt || l.date).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(clean);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, "leads.xlsx");
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Leads</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-[var(--border)] rounded bg-[var(--panel)]"
        >
          {months.map((m) => (
            <option key={m.label} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 border border-[var(--border)] rounded bg-[var(--panel)]"
        >
          <option value="">All Years</option>
          {availableYears.map((y: any) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>

        <button
          onClick={exportExcel}
          className="px-4 py-2 rounded border border-[var(--border)] bg-[var(--panel)]"
        >
          Export Excel
        </button>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)]">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Mobile</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredLeads.map((l) => (
              <tr key={l._id} className="border-b border-[var(--border)]">
                <td className="p-3">{l.name}</td>
                <td className="p-3">{l.email}</td>
                <td className="p-3">{l.phone || "-"}</td>
                <td className="p-3">{l.product || "-"}</td>
                <td className="p-3">
                  {new Date(l.createdAt || l.date).toLocaleDateString()}
                </td>

                <td className="p-3">
                  <select
                    value={l.status || "new"}
                    onChange={(e) =>
                      updateStatus(l._id, e.target.value)
                    }
                    className={`px-3 py-1 rounded text-white ${statusColors[l.status || "new"]}`}
                  >
                    <option value="new">new</option>
                    <option value="contacted">contacted</option>
                    <option value="closed">closed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLeads.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No leads found for selected period.
          </div>
        )}
      </div>
    </div>
  );
}