"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const statusColors: any = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  closed: "bg-green-500",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);

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

  // ✅ Export Excel
  const exportExcel = () => {
    const clean = leads.map((l) => ({
      Name: l.name,
      Email: l.email,
      Status: l.status || "new",
      Date: new Date(l.date).toLocaleString(),
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

      {/* ✅ Export button */}
      <button
        onClick={exportExcel}
        className="mb-4 px-4 py-2 rounded border border-[var(--border)] bg-[var(--panel)]"
      >
        Export Excel
      </button>

      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)]">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {leads.map((l) => (
              <tr key={l._id} className="border-b border-[var(--border)]">
                <td className="p-3">{l.name}</td>
                <td className="p-3">{l.email}</td>

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
      </div>
    </div>
  );
}