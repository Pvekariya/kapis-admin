"use client";

import { useEffect, useState } from "react";

const fmt = (v: number) => Math.round(v || 0).toLocaleString("en-IN");

export default function SalaryPage() {
  const today = new Date();
  const [month, setMonth]   = useState(today.getMonth() + 1);
  const [year, setYear]     = useState(today.getFullYear());
  const [data, setData]     = useState<any[]>([]);
  const [advances, setAdvances] = useState<Record<string,any[]>>({});
  const [advanceState, setAdvanceState] = useState<Record<string,{ amount:string; reason:string; paymentMode:string }>>({});
  const [salaryMode, setSalaryMode]     = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [salRes, advRes] = await Promise.all([
      fetch(`/api/staff/salary?month=${month}&year=${year}`, { credentials:"include" }),
      fetch(`/api/staff/advances?month=${month}&year=${year}`, { credentials:"include" }),
    ]);
    const sal = await salRes.json();
    const adv = await advRes.json();
    setData(Array.isArray(sal) ? sal : []);
    if (Array.isArray(adv)) {
      const grouped: Record<string,any[]> = {};
      adv.forEach((a:any) => {
        if (!grouped[a.staffId]) grouped[a.staffId] = [];
        grouped[a.staffId].push(a);
      });
      setAdvances(grouped);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [month, year]); // eslint-disable-line

  const lockMonth = async (staffId: string) => {
    await fetch("/api/staff/salary", {
      method:"PUT", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ staffId, month, year }),
    });
    load();
  };

  const markPaid = async (s: any) => {
    if (!s.remaining || s.remaining <= 0) return;
    await fetch("/api/staff/salary", {
      method:"POST", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ staffId:s.staffId, month, year, amount:s.remaining, paymentMode:salaryMode[s.staffId]||"Cash" }),
    });
    load();
  };

  const addAdvance = async (staffId: string) => {
    const entry = advanceState[staffId];
    if (!entry?.amount) return;
    await fetch("/api/staff/advances", {
      method:"POST", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ staffId, amount:Number(entry.amount), reason:entry.reason||"", paymentMode:entry.paymentMode||"Cash", month, year }),
    });
    setAdvanceState(prev => ({ ...prev, [staffId]:{ amount:"", reason:"", paymentMode:"" } }));
    load();
  };

  const deleteAdvance = async (id: string) => {
    await fetch("/api/staff/advances", {
      method:"DELETE", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const totalEarned    = data.reduce((s,d) => s + (d.earned||0), 0);
  const totalAdvance   = data.reduce((s,d) => s + (d.totalAdvance||0), 0);
  const totalRemaining = data.reduce((sum, d) => {
    const remaining = d.isPaid ? 0 : Number(d.remaining || 0);
    return sum + remaining;
  }, 0);

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Salary Management</h1>
        <div style={{ display:"flex", gap:8 }}>
          <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ maxWidth:140 }}>
            {Array.from({ length:12 },(_,i) => (
              <option key={i} value={i+1}>
                {new Date(0,i).toLocaleString("default",{ month:"long" })}
              </option>
            ))}
          </select>
          <select className="input" value={year} onChange={e => setYear(Number(e.target.value))} style={{ maxWidth:100 }}>
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        <div className="stat-card sc-green"><div className="sc-border"/><div className="sc-glow"/>
          <p className="sc-label">Total Earned</p><p className="sc-value">₹{fmt(totalEarned)}</p>
        </div>
        <div className="stat-card sc-amber"><div className="sc-border"/><div className="sc-glow"/>
          <p className="sc-label">Total Advance</p><p className="sc-value">₹{fmt(totalAdvance)}</p>
        </div>
        <div className="stat-card sc-blue"><div className="sc-border"/><div className="sc-glow"/>
          <p className="sc-label">Net Payable</p><p className="sc-value">₹{fmt(totalRemaining)}</p>
        </div>
        <div className="stat-card sc-purple"><div className="sc-border"/><div className="sc-glow"/>
          <p className="sc-label">Active Staff</p><p className="sc-value">{data.length}</p>
        </div>
      </div>

      {/* Staff salary cards */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"48px 0" }}>
          <div className="spinner" />
        </div>
      ) : data.map(s => {
        const visibleRemaining = s.isPaid ? 0 : Number(s.remaining || 0);

        return (
        <div key={s.staffId} className="g-card" style={{ padding:"20px 22px", marginBottom:12 }}>

          {/* Top row */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <p style={{ fontWeight:600, fontSize:15, color:"var(--text-1)", marginBottom:3 }}>{s.name}</p>
              <p style={{ fontSize:12, color:"var(--text-3)" }}>
                Monthly Salary: <span style={{ fontFamily:"'DM Mono',monospace" }}>₹{fmt(s.monthlySalary)}</span>
                <span style={{ marginLeft:10 }}>· {s.workedUnits} days worked</span>
              </p>
            </div>
            <div style={{ textAlign:"right", display:"flex", flexDirection:"column", gap:3 }}>
              <p style={{ fontSize:12 }}>
                Earned: <span style={{ color:"var(--green)", fontWeight:600, fontFamily:"'DM Mono',monospace" }}>₹{fmt(s.earned)}</span>
              </p>
              <p style={{ fontSize:12 }}>
                Advance: <span style={{ color:"var(--amber)", fontWeight:600, fontFamily:"'DM Mono',monospace" }}>₹{fmt(s.totalAdvance)}</span>
              </p>
              {s.isPaid && (
                <p style={{ fontSize:12 }}>
                  Paid: <span style={{ color:"var(--green)", fontWeight:600, fontFamily:"'DM Mono',monospace" }}>₹{fmt(s.paidAmount || s.grossRemaining || s.earned)}</span>
                </p>
              )}
              <p style={{ fontSize:13, fontWeight:700 }}>
                Remaining: <span style={{ color: visibleRemaining < 0 ? "var(--red)" : "var(--blue)", fontFamily:"'DM Mono',monospace" }}>
                  ₹{fmt(visibleRemaining)}
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {!s.isLocked && (
              <button className="btn btn-primary btn-sm" onClick={() => lockMonth(s.staffId)}>
                Lock Month
              </button>
            )}
            {s.isLocked && !s.isPaid && (
              <>
                <select className="input" style={{ maxWidth:120, height:30, fontSize:12 }}
                  value={salaryMode[s.staffId]||"Cash"}
                  onChange={e => setSalaryMode(prev => ({ ...prev, [s.staffId]:e.target.value }))}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank">Bank</option>
                </select>
                <button className="btn btn-success btn-sm" onClick={() => markPaid(s)}>
                  Mark Salary Paid
                </button>
              </>
            )}
            {s.isPaid && (
              <span className="badge badge-green">✓ Salary Paid</span>
            )}
          </div>

          {/* Advance section */}
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:14 }}>
            <p className="section-label" style={{ marginBottom:10 }}>Advance Payment</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr auto", gap:8, marginBottom:10 }}>
              <input type="number" className="input" placeholder="Amount"
                value={advanceState[s.staffId]?.amount||""}
                onChange={e => setAdvanceState(prev => ({ ...prev, [s.staffId]:{ ...prev[s.staffId], amount:e.target.value } }))} />
              <input className="input" placeholder="Reason (optional)"
                value={advanceState[s.staffId]?.reason||""}
                onChange={e => setAdvanceState(prev => ({ ...prev, [s.staffId]:{ ...prev[s.staffId], reason:e.target.value } }))} />
              <select className="input"
                value={advanceState[s.staffId]?.paymentMode||"Cash"}
                onChange={e => setAdvanceState(prev => ({ ...prev, [s.staffId]:{ ...prev[s.staffId], paymentMode:e.target.value } }))}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank">Bank</option>
              </select>
              <button className="btn btn-warning btn-sm" onClick={() => addAdvance(s.staffId)}>
                Pay
              </button>
            </div>

            {/* Advance history */}
            {(advances[s.staffId]||[]).map((a:any) => (
              <div key={a._id} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"8px 12px", background:"var(--glass-1)", borderRadius:8,
                marginBottom:6, border:"1px solid var(--border)",
              }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, fontFamily:"'DM Mono',monospace" }}>₹{fmt(a.amount)}</p>
                  <p style={{ fontSize:11, color:"var(--text-3)" }}>{a.reason||"No reason"} · {a.paymentMode}</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteAdvance(a._id)}>Delete</button>
              </div>
            ))}
          </div>

        </div>
      )})}

    </div>
  );
}
