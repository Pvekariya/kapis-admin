"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const STATUS_BADGE: Record<string, string> = {
  new: "badge-blue",
  contacted: "badge-amber",
  closed: "badge-green",
};

const MONTHS = [
  { label: "All Months", value: "" },
  ...["January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ].map((label, i) => ({ label, value: String(i) })),
];

export default function LeadsPage() {
  const [leads, setLeads]               = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear]   = useState("");
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(true);

  const load = () => {
    fetch("/api/admin", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLeads(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const date = new Date(l.createdAt || l.date);
      const monthMatch = selectedMonth === "" || date.getMonth() === Number(selectedMonth);
      const yearMatch  = selectedYear  === "" || date.getFullYear() === Number(selectedYear);
      const searchMatch = search === "" ||
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase());
      return monthMatch && yearMatch && searchMatch;
    });
  }, [leads, selectedMonth, selectedYear, search]);

  const availableYears = Array.from(
    new Set(
      leads
        .map(l => new Date(l.createdAt || l.date).getFullYear())
        .filter(y => !isNaN(y))
    )
  ).sort((a, b) => b - a);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(l => ({
      Name: l.name, Email: l.email, Mobile: l.phone || "-",
      Product: l.product || "-", Status: l.status || "new",
      Date: new Date(l.createdAt || l.date).toLocaleString(),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      { type: "application/octet-stream" }),
      "leads.xlsx"
    );
  };

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Leads</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="badge badge-blue">{filtered.length} leads</span>
          <button className="btn" onClick={exportExcel}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="g-panel" style={{ padding: 14, display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <input className="input" placeholder="Search name / email…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 240 }} />
        <select className="input" value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)} style={{ maxWidth: 160 }}>
          {MONTHS.map(m => <option key={m.label} value={m.value}>{m.label}</option>)}
        </select>
        <select className="input" value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)} style={{ maxWidth: 130 }}>
          <option value="">All Years</option>
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="btn" onClick={() => {
          setSearch(""); setSelectedMonth(""); setSelectedYear("");
        }}>Reset</button>
      </div>

      {/* Table */}
      <div className="g-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Product</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>
                <div style={{ display:"flex", justifyContent:"center", padding:"32px 0" }}>
                  <div className="spinner" />
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:"center", padding:"32px 0", color:"var(--text-3)" }}>
                No leads found
              </td></tr>
            ) : filtered.map(l => (
              <tr key={l._id}>
                <td style={{ fontWeight: 500 }}>{l.name}</td>
                <td style={{ color: "var(--text-2)" }}>{l.email}</td>
                <td>{l.phone || "—"}</td>
                <td>{l.product || "—"}</td>
                <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {new Date(l.createdAt || l.date).toLocaleDateString()}
                </td>
                <td>
                  <select
                    value={l.status || "new"}
                    onChange={e => updateStatus(l._id, e.target.value)}
                    className={`badge ${STATUS_BADGE[l.status || "new"]}`}
                    style={{ border: "none", cursor: "pointer", background: "transparent", font: "inherit" }}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
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