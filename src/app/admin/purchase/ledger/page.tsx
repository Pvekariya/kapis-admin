"use client";

import { useEffect, useMemo, useState } from "react";

const fmt = (v: number) => Math.round(v || 0).toLocaleString("en-IN");

export default function PurchaseLedger() {
  const [data, setData]       = useState<any[]>([]);
  const [search, setSearch]   = useState("");
  const [fromDate, setFrom]   = useState("");
  const [toDate, setTo]       = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/purchase/ledger", { credentials:"include" })
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return data.filter(b => {
      const matchSearch =
        b.invoice?.toLowerCase().includes(search.toLowerCase()) ||
        b.supplier?.toLowerCase().includes(search.toLowerCase());
      const d = new Date(b.date);
      const matchFrom = fromDate ? d >= new Date(fromDate) : true;
      const matchTo   = toDate   ? d <= new Date(toDate)   : true;
      return matchSearch && matchFrom && matchTo;
    });
  }, [data, search, fromDate, toDate]);

  const totalSpent = filtered.reduce((s, b) => s + Number(b.total||0), 0);

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Purchase Ledger</h1>
        <span className="badge badge-red">₹{fmt(totalSpent)} total spent</span>
      </div>

      {/* Filters */}
      <div className="g-panel" style={{ padding:14, display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
        <input className="input" placeholder="Search invoice / vendor…"
          value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:240 }} />
        <div className="field">
          <label className="field-label">From</label>
          <input type="date" className="input" value={fromDate} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">To</label>
          <input type="date" className="input" value={toDate} onChange={e => setTo(e.target.value)} />
        </div>
        <button className="btn" onClick={() => { setSearch(""); setFrom(""); setTo(""); }}
          style={{ alignSelf:"flex-end" }}>
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="g-table">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Vendor</th>
              <th>Products</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>
                <div style={{ display:"flex", justifyContent:"center", padding:"32px 0" }}>
                  <div className="spinner" />
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:"center", padding:"32px 0", color:"var(--text-3)" }}>
                No purchase records found
              </td></tr>
            ) : filtered.map(b => (
              <tr key={b._id}>
                <td>
                  <span style={{ fontWeight:600, fontFamily:"'DM Mono',monospace", fontSize:13 }}>
                    {b.invoice}
                  </span>
                </td>
                <td style={{ fontWeight:500 }}>{b.supplier}</td>
                <td style={{ color:"var(--text-2)", fontSize:12 }}>
                  {b.items?.length > 0 ? b.items.map((i:any) => i.name).join(", ") : b.product || "—"}
                </td>
                <td style={{ fontSize:12 }}>
                  {b.items?.length > 0 ? b.items.map((i:any) => i.qty).join(", ") : b.quantity || "—"}
                </td>
                <td>
                  <span style={{ fontWeight:700, color:"var(--red)", fontFamily:"'DM Mono',monospace" }}>
                    ₹{fmt(b.total)}
                  </span>
                </td>
                <td><span className="badge badge-neutral">{b.paymentMode}</span></td>
                <td style={{ fontSize:12, color:"var(--text-2)" }}>
                  {new Date(b.date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}