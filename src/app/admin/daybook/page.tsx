"use client";

import { useEffect, useState } from "react";

const fmt = (v: number) => Math.round(v || 0).toLocaleString("en-IN");

function getCurrentFYYear() {
  const t = new Date();
  return t.getMonth() + 1 <= 3 ? t.getFullYear() - 1 : t.getFullYear();
}
function getFYRange(year: number) {
  return { start: `${year}-04-01`, end: `${year + 1}-03-31` };
}

export default function DaybookPage() {
  const [entries,  setEntries]  = useState<any[]>([]);
  const [summary,  setSummary]  = useState({
    totalIncome:0, totalExpense:0, netBalance:0,
    cashBalance:0, bankBalance:0, totalDue:0,
  });
  const [filters,  setFilters]  = useState({ from:"", to:"", type:"", paymentMode:"" });
  const [quickRange, setQuick]  = useState<"today"|"month"|"fy"|"all">("all");
  const [selectedFY, setFY]     = useState(getCurrentFYYear());
  const [loading,  setLoading]  = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors,   setErrors]   = useState<Record<string,boolean>>({});
  const [markingId, setMarkingId] = useState<string|null>(null);
  const [markMode,  setMarkMode]  = useState<Record<string,string>>({});
  const [form, setForm] = useState({
    type:"expense", category:"misc", description:"",
    amount:"", paymentMode:"cash", date:"",
  });

  const load = async () => {
    const p = new URLSearchParams();
    if (filters.from)        p.set("from", filters.from);
    if (filters.to)          p.set("to",   filters.to);
    if (filters.type)        p.set("type", filters.type);
    if (filters.paymentMode) p.set("paymentMode", filters.paymentMode);
    const res  = await fetch(`/api/daybook?${p}`, { credentials:"include" });
    const data = await res.json();
    setEntries(data.entries || []);
    setSummary(data.summary  || {});
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]); // eslint-disable-line

  const applyQuick = (type: "today"|"month"|"fy"|"all") => {
    setQuick(type);
    const t  = new Date();
    const yy = t.getFullYear();
    const mm = String(t.getMonth()+1).padStart(2,"0");
    const dd = String(t.getDate()).padStart(2,"0");
    if      (type==="today") { const d=`${yy}-${mm}-${dd}`; setFilters({from:d,to:d,type:"",paymentMode:""}); }
    else if (type==="month") { const last=new Date(yy,t.getMonth()+1,0).getDate(); setFilters({from:`${yy}-${mm}-01`,to:`${yy}-${mm}-${last}`,type:"",paymentMode:""}); }
    else if (type==="fy")    { const {start,end}=getFYRange(selectedFY); setFilters({from:start,to:end,type:"",paymentMode:""}); }
    else                     { setFilters({from:"",to:"",type:"",paymentMode:""}); }
  };

  const addEntry = async () => {
    if (isSaving) return;
    const errs: Record<string,boolean> = {};
    if (!form.description.trim()) errs.description = true;
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount)<=0) errs.amount = true;
    if (!form.date) errs.date = true;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setIsSaving(true);
    try {
      await fetch("/api/daybook", {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({...form, amount:Number(form.amount)}),
      });
      setForm({type:"expense",category:"misc",description:"",amount:"",paymentMode:"cash",date:""});
      setErrors({});
      await load();
    } finally { setIsSaving(false); }
  };

  /* Mark a due entry as paid */
  const markDuePaid = async (entryId: string) => {
    setMarkingId(entryId);
    try {
      await fetch("/api/daybook", {
        method:"PATCH", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id:entryId, paymentMode: markMode[entryId]||"cash" }),
      });
      await load();
    } finally { setMarkingId(null); }
  };

  const fyOptions = Array.from({length:6},(_,i)=>getCurrentFYYear()-i);

  const SUMMARY_CARDS = [
    { label:"Income",  value:summary.totalIncome,  color:"green"  as const },
    { label:"Expense", value:summary.totalExpense, color:"red"    as const },
    { label:"Net",     value:summary.netBalance,   color:"amber"  as const },
    { label:"Cash",    value:summary.cashBalance,  color:"blue"   as const },
    { label:"Bank",    value:summary.bankBalance,  color:"purple" as const },
  ];

  /* Separate out unpaid dues to show at top */
  const unpaidDues = entries.filter(e => e.type==="due" && e.status==="unpaid");
  const otherEntries = entries.filter(e => !(e.type==="due" && e.status==="unpaid"));

  return (
    <div className="fade-in">

      <div className="page-header">
        <h1 className="page-title">Daybook</h1>
        {summary.totalDue > 0 && (
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:"var(--text-2)"}}>Outstanding dues:</span>
            <span className="badge badge-red" style={{fontSize:13,padding:"3px 12px"}}>
              ₹{fmt(summary.totalDue)}
            </span>
          </div>
        )}
      </div>

      {/* Quick range */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {(["today","month","all"] as const).map(r=>(
          <button key={r} onClick={()=>applyQuick(r)}
            className={`btn ${quickRange===r?"btn-primary":""}`}>
            {r==="today"?"Today":r==="month"?"This Month":"All Time"}
          </button>
        ))}
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={()=>applyQuick("fy")}
            className={`btn ${quickRange==="fy"?"btn-primary":""}`}>
            FY {selectedFY}-{String(selectedFY+1).slice(-2)}
          </button>
          <select className="input" style={{maxWidth:130}} value={selectedFY}
            onChange={e=>{const y=Number(e.target.value);setFY(y);if(quickRange==="fy"){const{start,end}=getFYRange(y);setFilters({from:start,to:end,type:"",paymentMode:""});}}}>
            {fyOptions.map(y=><option key={y} value={y}>FY {y}-{String(y+1).slice(-2)}</option>)}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="g-panel" style={{padding:14,display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        <div className="field">
          <label className="field-label">From</label>
          <input type="date" className="input" value={filters.from} onChange={e=>setFilters(f=>({...f,from:e.target.value}))}/>
        </div>
        <div className="field">
          <label className="field-label">To</label>
          <input type="date" className="input" value={filters.to} onChange={e=>setFilters(f=>({...f,to:e.target.value}))}/>
        </div>
        <div className="field">
          <label className="field-label">Type</label>
          <select className="input" value={filters.type} onChange={e=>setFilters(f=>({...f,type:e.target.value}))}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="due">Due</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label">Payment</label>
          <select className="input" value={filters.paymentMode} onChange={e=>setFilters(f=>({...f,paymentMode:e.target.value}))}>
            <option value="">All Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
          </select>
        </div>
        <button className="btn" onClick={load} style={{alignSelf:"flex-end"}}>Refresh</button>
      </div>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
        {SUMMARY_CARDS.map(c=>(
          <div key={c.label} className={`stat-card sc-${c.color}`}>
            <div className="sc-border"/><div className="sc-glow"/>
            <p className="sc-label">{c.label}</p>
            <p className="sc-value" style={{fontSize:18}}>₹{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* ── Unpaid Dues section ───────────────────────────── */}
      {unpaidDues.length > 0 && (
        <div style={{marginBottom:20}}>
          <p className="section-label" style={{marginBottom:10}}>
            Outstanding Dues ({unpaidDues.length})
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {unpaidDues.map(e=>(
              <div key={e._id} style={{
                background:"var(--red-dim)",
                border:"1px solid var(--red-border)",
                borderRadius:12, padding:"12px 16px",
                display:"flex", alignItems:"center",
                justifyContent:"space-between", gap:12, flexWrap:"wrap",
              }}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:600,fontSize:13,color:"var(--red)",marginBottom:2}}>
                    {e.description}
                  </p>
                  <p style={{fontSize:11,color:"var(--text-3)"}}>
                    {e.date?new Date(e.date).toLocaleDateString():"-"}
                    {e.invoiceRef && <span style={{marginLeft:8}}>Invoice: {e.invoiceRef}</span>}
                  </p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <span style={{
                    fontWeight:700,fontSize:15,fontFamily:"'DM Mono',monospace",
                    color:"var(--red)",
                  }}>
                    ₹{fmt(e.amount)}
                  </span>
                  <select
                    className="input"
                    style={{width:100,height:30,fontSize:12}}
                    value={markMode[e._id]||"cash"}
                    onChange={ev=>setMarkMode(p=>({...p,[e._id]:ev.target.value}))}>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank</option>
                  </select>
                  <button
                    className="btn btn-success btn-sm"
                    disabled={markingId===e._id}
                    onClick={()=>markDuePaid(e._id)}
                  >
                    {markingId===e._id?"Marking…":"Mark Paid"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add entry form */}
      <div className="g-card" style={{padding:"18px 20px",marginBottom:20}}>
        <p className="section-label">New Entry</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 2fr 1fr 1fr auto",gap:10,alignItems:"end"}}>
          <div className="field">
            <label className="field-label">Type</label>
            <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Category</label>
            <select className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              {["sale","purchase","salary","advance","misc"].map(c=>(
                <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Date</label>
            <input type="date" className={`input ${errors.date?"error":""}`}
              value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
          </div>
          <div className="field">
            <label className="field-label">Description</label>
            <input className={`input ${errors.description?"error":""}`}
              placeholder="Description" value={form.description}
              onChange={e=>setForm({...form,description:e.target.value})}/>
          </div>
          <div className="field">
            <label className="field-label">Amount</label>
            <input type="number" className={`input ${errors.amount?"error":""}`}
              placeholder="0" value={form.amount}
              onChange={e=>setForm({...form,amount:e.target.value})}/>
          </div>
          <div className="field">
            <label className="field-label">Payment</label>
            <select className="input" value={form.paymentMode} onChange={e=>setForm({...form,paymentMode:e.target.value})}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={addEntry} disabled={isSaving} style={{alignSelf:"flex-end"}}>
            {isSaving?"…":"Add"}
          </button>
        </div>
      </div>

      {/* Entries table */}
      <div className="g-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th>Payment</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>
                <div style={{display:"flex",justifyContent:"center",padding:"32px 0"}}>
                  <div className="spinner"/>
                </div>
              </td></tr>
            ) : otherEntries.length===0 ? (
              <tr><td colSpan={6} style={{textAlign:"center",padding:"32px 0",color:"var(--text-3)"}}>
                No entries for this period
              </td></tr>
            ) : otherEntries.map(e=>(
              <tr key={e._id}>
                <td style={{fontSize:12,color:"var(--text-2)",fontFamily:"'DM Mono',monospace"}}>
                  {e.date?new Date(e.date).toLocaleDateString():"—"}
                </td>
                <td>
                  {e.type==="income" && <span className="badge badge-green">Income</span>}
                  {e.type==="expense" && <span className="badge badge-red">Expense</span>}
                  {e.type==="due" && e.status==="paid" && <span className="badge badge-blue">Due Collected</span>}
                </td>
                <td style={{color:"var(--text-2)"}}>{e.category}</td>
                <td style={{maxWidth:260}}>
                  <p style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {e.description||"—"}
                  </p>
                  {e.invoiceRef && (
                    <p style={{fontSize:10,color:"var(--text-3)"}}>Invoice: {e.invoiceRef}</p>
                  )}
                </td>
                <td>
                  <span className="badge badge-neutral">{e.paymentMode}</span>
                </td>
                <td style={{
                  fontWeight:600,
                  fontFamily:"'DM Mono',monospace",
                  color: e.type==="income"?"var(--green)":e.type==="due"?"var(--blue)":"var(--red)",
                }}>
                  {e.type==="income"?"+":e.type==="expense"?"−":""}₹{fmt(Number(e.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}