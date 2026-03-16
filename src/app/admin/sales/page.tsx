"use client";

import { useEffect, useMemo, useState } from "react";

const fmt = (v: number) => Math.round(v || 0).toLocaleString("en-IN");

/* ── Standalone invoice component ────────────────────────── */
function InvoiceSheet({ data }: { data: any }) {
  if (!data) return null;

  const items     = data.items || [];
  const subtotal  = items.reduce((s: number, i: any) =>
    s + Number(i.qty || 0) * Number(i.price || 0), 0);
  const gstRate   = Number(data.gstRate ?? 0);
  const gst       = subtotal * (gstRate / 100);
  const total     = subtotal + gst;
  const paid      = Number(data.paid ?? 0);
  const due       = total - paid;
  const dateStr   = data.date
    ? new Date(data.date).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");

  const rows = [...items];
  while (rows.length < 10) rows.push({ name:"", qty:"", price:"" });

  const cell = (extra?: React.CSSProperties): React.CSSProperties => ({
    borderLeft: "1px solid #ccc", borderRight: "1px solid #ccc",
    padding: "2px 5px", fontSize: 10,
    ...extra,
  });

  return (
    <div id="kapis-invoice" style={{
      width: "148mm", minHeight: "210mm",
      padding: "8mm", background: "#fff", color: "#111",
      fontSize: "12px", fontFamily: "'DM Sans','Arial',sans-serif",
      boxSizing: "border-box", display: "flex", flexDirection: "column",
      border: "1.5px solid #333",
    }}>
      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:6 }}>
        <div style={{ fontWeight:800, fontSize:18, letterSpacing:"0.06em", marginBottom:1 }}>
          🔆 KAPIS LIGHTS
        </div>
        <div style={{ fontSize:8, letterSpacing:"0.18em", color:"#666", textTransform:"uppercase" }}>
          Invoice
        </div>
        <div style={{ height:1, background:"#bbb", marginTop:4 }} />
      </div>

      {/* Customer + Invoice row */}
      <div style={{ border:"1px solid #ccc", padding:"5px 8px", display:"flex",
        justifyContent:"space-between", marginBottom:5, fontSize:11 }}>
        <div>
          <div style={{ fontWeight:700 }}>To: {data.customer || "———"}</div>
          {data.address && <div style={{ marginTop:2, color:"#444", fontSize:10 }}>{data.address}</div>}
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10 }}>Date: {dateStr}</div>
          <div style={{ fontWeight:700 }}>Invoice: {data.invoice}</div>
        </div>
      </div>

      {/* Items table */}
      <div style={{ overflow:"hidden", borderBottom:"1px solid #ccc" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed" }}>
          <thead>
            <tr style={{ borderTop:"1px solid #ccc", borderBottom:"1px solid #ccc" }}>
              {[["7%","Sr."],["43%","Product"],["13%","Qty"],["17%","Price"],["20%","Sub Total"]].map(([w,h]) => (
                <th key={h as string} style={{
                  width:w as string, padding:"3px 5px",
                  textAlign:"center", fontSize:11, fontWeight:700,
                  borderLeft:"1px solid #ccc", borderRight:"1px solid #ccc",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item:any, idx:number) => (
              <tr key={idx} style={{ height:"10.5mm" }}>
                <td style={cell({ textAlign:"center" })}>{item.name ? idx+1 : ""}</td>
                <td style={cell({ textAlign:"left", paddingLeft:6 })}>{item.name || ""}</td>
                <td style={cell({ textAlign:"center" })}>{item.qty || ""}</td>
                <td style={cell({ textAlign:"center" })}>{item.price ? `₹${item.price}` : ""}</td>
                <td style={cell({ textAlign:"center" })}>
                  {item.qty && item.price ? `₹${Number(item.qty)*Number(item.price)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Spacer */}
      <div style={{ flex:1, minHeight:4 }} />

      {/* Note */}
      {data.note && (
        <div style={{ borderTop:"1px solid #ddd", padding:"4px 2px", marginBottom:4,
          fontSize:10, color:"#333", lineHeight:1.5, wordBreak:"break-word" }}>
          <strong>NOTE:</strong> {data.note}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop:"1px solid #bbb", paddingTop:5,
        display:"flex", justifyContent:"space-between", fontSize:11 }}>
        <div style={{ border:"1px solid #ccc", padding:"5px 8px", width:"52%", lineHeight:1.85 }}>
          <div>Subtotal: ₹{fmt(subtotal)}</div>
          {gstRate > 0 && <div>GST ({gstRate}%): ₹{fmt(gst)}</div>}
          <div>Paid: ₹{fmt(paid)}</div>
          <div>Due: ₹{fmt(due)}</div>
          <div style={{ fontWeight:700, borderTop:"1px solid #ccc", marginTop:3, paddingTop:3 }}>
            Total: ₹{fmt(total)}
          </div>
        </div>
        <div style={{ textAlign:"right", display:"flex", flexDirection:"column",
          justifyContent:"space-between", paddingBottom:2 }}>
          <div style={{ fontSize:9, color:"#555" }}>For KAPIS LIGHTS</div>
          <div style={{ borderTop:"1px solid #333", paddingTop:3, fontSize:9,
            marginTop:28, whiteSpace:"nowrap" }}>
            Authorised Signatory
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Invoice preview modal ────────────────────────────────── */
function InvoicePreviewModal({
  data,
  onClose,
}: {
  data: any;
  onClose: () => void;
}) {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A5 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          #kapis-invoice,
          #kapis-invoice * { visibility: visible !important; }
          #kapis-invoice {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 148mm !important; min-height: 210mm !important;
            margin: 0 !important; padding: 8mm !important;
            background: #fff !important; color: #000 !important;
            border: none !important; box-shadow: none !important;
          }
          /* Hide the modal chrome */
          .inv-preview-chrome { display: none !important; }
        }
      `}</style>

      {/* Full-screen overlay */}
      <div style={{
        position:"fixed", inset:0,
        background:"rgba(0,0,0,0.75)",
        backdropFilter:"blur(6px)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"flex-start",
        zIndex:10000, padding:"24px 16px",
        overflowY:"auto",
      }}>
        {/* Toolbar */}
        <div className="inv-preview-chrome" style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          width:"148mm", maxWidth:"100%",
          marginBottom:14,
        }}>
          <p style={{ fontSize:13, color:"#e5e7eb", fontWeight:500 }}>
            Invoice Preview
          </p>
          <div style={{ display:"flex", gap:8 }}>
            <button
              onClick={() => window.print()}
              style={{
                display:"flex", alignItems:"center", gap:6,
                background:"#3b82f6", border:"none", borderRadius:8,
                padding:"8px 18px", color:"#fff", fontSize:13,
                fontWeight:600, cursor:"pointer", fontFamily:"inherit",
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
            </button>
            <button
              onClick={onClose}
              style={{
                background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)",
                borderRadius:8, padding:"8px 14px", color:"#e5e7eb",
                fontSize:13, cursor:"pointer", fontFamily:"inherit",
              }}>
              Close
            </button>
          </div>
        </div>

        {/* The invoice — fully visible, print-ready */}
        <InvoiceSheet data={data} />
      </div>
    </>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function SalesPage() {
  const [sales,    setSales]    = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [editing,  setEditing]  = useState<any | null>(null);
  const [form,     setForm]     = useState<any>(null);
  const [search,   setSearch]   = useState("");
  const [month,    setMonth]    = useState("");
  const [year,     setYear]     = useState("");
  const [fromDate, setFrom]     = useState("");
  const [toDate,   setTo]       = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  const loadSales = () =>
    fetch("/api/sales", { credentials:"include" })
      .then(r => r.json())
      .then(d => { setSales(Array.isArray(d) ? d : []); setLoading(false); });

  useEffect(() => { loadSales(); }, []);

  const filtered = useMemo(() => {
    return sales.filter(b => {
      const d = new Date(b.date);
      if (month    && d.getMonth()+1  !== Number(month))  return false;
      if (year     && d.getFullYear() !== Number(year))    return false;
      if (search   && !b.customer?.toLowerCase().includes(search.toLowerCase()) &&
                      !b.invoice?.toLowerCase().includes(search.toLowerCase()))  return false;
      if (fromDate && new Date(b.date) < new Date(fromDate)) return false;
      if (toDate   && new Date(b.date) > new Date(toDate))   return false;
      return true;
    });
  }, [sales, month, year, search, fromDate, toDate]);

  const totalRevenue = filtered.reduce((s, b) => s + Number(b.total||0), 0);

  /* Live recalc */
  const editSubtotal = form
    ? (form.items||[]).reduce((s:number,i:any) => s+Number(i.qty||0)*Number(i.price||0), 0)
    : 0;
  const editGstRate  = Number(form?.gstRate ?? 0);
  const editGst      = editSubtotal*(editGstRate/100);
  const editTotal    = editSubtotal+editGst;

  const openEdit = (bill: any) => {
    const clone = JSON.parse(JSON.stringify(bill));
    const sub   = (clone.items||[]).reduce((s:number,i:any) =>
      s+Number(i.qty||0)*Number(i.price||0), 0);
    clone.gstRate = sub > 0 ? Math.round((clone.gst/sub)*100) : 0;
    setEditing(bill);
    setForm(clone);
    setSelected(null);
  };

  /* Build print-ready data from the current form state */
  const previewForm = () => {
    setPreviewData({ ...form, gstRate: editGstRate });
    setEditing(null);
  };

  const previewBill = (bill: any) => {
    const clone = JSON.parse(JSON.stringify(bill));
    const sub   = (clone.items||[]).reduce((s:number,i:any) =>
      s+Number(i.qty||0)*Number(i.price||0), 0);
    clone.gstRate = sub > 0 ? Math.round(((clone.gst||0)/sub)*100) : 0;
    setPreviewData(clone);
    setSelected(null);
  };

  const PrintIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  );

  return (
    <>
      {/* Invoice preview modal */}
      {previewData && (
        <InvoicePreviewModal
          data={previewData}
          onClose={() => setPreviewData(null)}
        />
      )}

      <div className="fade-in">

        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Sales Ledger</h1>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span className="badge badge-green">₹{fmt(totalRevenue)}</span>
            <button className="btn" onClick={() => window.print()}>
              <PrintIcon /> Print Ledger
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="g-panel" style={{ padding:14, display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
          <input className="input" placeholder="Search invoice / customer…"
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:220 }} />
          <select className="input" value={month} onChange={e => setMonth(e.target.value)} style={{ maxWidth:110 }}>
            <option value="">Month</option>
            {Array.from({ length:12 },(_,i) => <option key={i} value={i+1}>{i+1}</option>)}
          </select>
          <input className="input" placeholder="Year" value={year}
            onChange={e => setYear(e.target.value)} style={{ maxWidth:90 }} />
          <input type="date" className="input" value={fromDate} onChange={e => setFrom(e.target.value)} />
          <input type="date" className="input" value={toDate}   onChange={e => setTo(e.target.value)} />
          <button className="btn" onClick={() => { setSearch(""); setMonth(""); setYear(""); setFrom(""); setTo(""); }}>
            Reset
          </button>
        </div>

        {/* Table */}
        <div className="g-table ledger-print">
          <table>
            <thead>
              <tr>
                <th>Invoice</th><th>Customer</th>
                <th>Total</th><th>Paid</th><th>Due</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}>
                  <div style={{ display:"flex", justifyContent:"center", padding:"32px 0" }}>
                    <div className="spinner" />
                  </div>
                </td></tr>
              ) : filtered.map(b => (
                <tr key={b._id} style={{ cursor:"pointer" }} onClick={() => setSelected(b)}>
                  <td>
                    <span style={{ color:"var(--accent)", fontWeight:600, fontFamily:"'DM Mono',monospace", fontSize:13 }}>
                      {b.invoice}
                    </span>
                  </td>
                  <td style={{ fontWeight:500 }}>{b.customer}</td>
                  <td style={{ fontWeight:600 }}>₹{fmt(b.total)}</td>
                  <td style={{ color:"var(--green)" }}>₹{fmt(b.paid||0)}</td>
                  <td>
                    <span className={(b.due||0)>0 ? "badge badge-red" : "badge badge-neutral"}>
                      ₹{fmt(b.due||0)}
                    </span>
                  </td>
                  <td style={{ fontSize:12, color:"var(--text-2)" }}>
                    {new Date(b.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail modal */}
        {selected && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth:540 }}>
              <div className="modal-header">
                <h3 className="modal-title">Invoice {selected.invoice}</h3>
                <button className="btn btn-icon btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                {[
                  ["Customer", selected.customer],
                  ["Date",     new Date(selected.date).toLocaleDateString()],
                  ["Address",  selected.address],
                  ["Payment",  selected.paymentMode||"cash"],
                ].filter(([,v]) => v).map(([k,v]) => (
                  <div key={k as string}>
                    <p style={{ fontSize:11, color:"var(--text-3)", marginBottom:2 }}>{k}</p>
                    <p style={{ fontSize:13, color:"var(--text-1)", fontWeight:500 }}>{v}</p>
                  </div>
                ))}
              </div>

              <div className="g-table" style={{ marginBottom:16 }}>
                <table>
                  <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                  <tbody>
                    {(selected.items||[]).map((i:any,idx:number) => (
                      <tr key={idx}>
                        <td>{i.name}</td><td>{i.qty}</td>
                        <td>₹{i.price}</td>
                        <td style={{ fontWeight:600 }}>₹{fmt(i.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="g-inset" style={{ padding:12, marginBottom:16, display:"flex", flexDirection:"column", gap:6 }}>
                {[
                  ["Subtotal", `₹${fmt(selected.subtotal)}`, "var(--text-1)"],
                  ["GST",      `₹${fmt(selected.gst)}`,      "var(--text-2)"],
                  ["Paid",     `₹${fmt(selected.paid||0)}`,  "var(--green)"],
                  ["Due",      `₹${fmt(selected.due||0)}`,   (selected.due||0)>0?"var(--red)":"var(--text-3)"],
                ].map(([k,v,c]) => (
                  <div key={k as string} style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                    <span style={{ color:"var(--text-2)" }}>{k}</span>
                    <span style={{ fontWeight:600, color:c as string }}>{v}</span>
                  </div>
                ))}
                <hr className="divider" style={{ margin:"4px 0" }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:700 }}>
                  <span>Total</span><span>₹{fmt(selected.total)}</span>
                </div>
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button className="btn" style={{ flex:1 }} onClick={() => previewBill(selected)}>
                  <PrintIcon /> Print Invoice
                </button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={() => openEdit(selected)}>
                  Edit Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editing && form && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth:580, maxHeight:"92vh", overflowY:"auto" }}>
              <div className="modal-header">
                <h3 className="modal-title">Edit Invoice</h3>
                <button className="btn btn-icon btn-sm" onClick={() => setEditing(null)}>✕</button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                <div className="field">
                  <label className="field-label">Invoice Number</label>
                  <input className="input" value={form.invoice||""}
                    onChange={e => setForm({ ...form, invoice:e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Customer</label>
                  <input className="input" value={form.customer||""}
                    onChange={e => setForm({ ...form, customer:e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Invoice Date</label>
                  <input type="date" className="input" value={form.date?.slice(0,10)||""}
                    onChange={e => setForm({ ...form, date:e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-label">Address</label>
                  <input className="input" value={form.address||""}
                    onChange={e => setForm({ ...form, address:e.target.value })} />
                </div>
              </div>

              <div className="g-inset" style={{ padding:"12px 14px", marginBottom:16 }}>
                <p className="section-label" style={{ marginBottom:10 }}>GST & Payment</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <div className="field">
                    <label className="field-label">GST Rate (%)</label>
                    <input type="number" className="input" placeholder="0"
                      value={form.gstRate??0} min={0} max={100}
                      onChange={e => setForm({ ...form, gstRate:Number(e.target.value) })} />
                  </div>
                  <div className="field">
                    <label className="field-label">Paid Amount</label>
                    <input type="number" className="input" placeholder="0"
                      value={form.paid??0} min={0}
                      onChange={e => setForm({ ...form, paid:Number(e.target.value) })} />
                  </div>
                  <div className="field">
                    <label className="field-label">Payment Mode</label>
                    <select className="input" value={form.paymentMode||"cash"}
                      onChange={e => setForm({ ...form, paymentMode:e.target.value })}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank">Bank</option>
                    </select>
                  </div>
                </div>
              </div>

              <p className="section-label" style={{ marginBottom:8 }}>Items</p>
              {(form.items||[]).map((item:any,idx:number) => (
                <div key={idx} className="g-inset" style={{ padding:12, marginBottom:8 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:8 }}>
                    <div className="field">
                      <label className="field-label">Product</label>
                      <input className="input" value={item.name||""}
                        onChange={e => {
                          const c=[...form.items]; c[idx].name=e.target.value;
                          setForm({ ...form, items:c });
                        }} />
                    </div>
                    <div className="field">
                      <label className="field-label">Qty</label>
                      <input type="number" className="input" value={item.qty}
                        onChange={e => {
                          const c=[...form.items]; c[idx].qty=Number(e.target.value);
                          c[idx].total=c[idx].qty*c[idx].price;
                          setForm({ ...form, items:c });
                        }} />
                    </div>
                    <div className="field">
                      <label className="field-label">Price</label>
                      <input type="number" className="input" value={item.price}
                        onChange={e => {
                          const c=[...form.items]; c[idx].price=Number(e.target.value);
                          c[idx].total=c[idx].qty*c[idx].price;
                          setForm({ ...form, items:c });
                        }} />
                    </div>
                  </div>
                  <p style={{ fontSize:11, color:"var(--text-3)", marginTop:6 }}>
                    Line total: ₹{fmt(item.total||item.qty*item.price)}
                  </p>
                </div>
              ))}
              <button className="btn btn-sm" style={{ marginBottom:16 }}
                onClick={() => setForm({ ...form, items:[...(form.items||[]),{ name:"",qty:1,price:0,total:0 }] })}>
                + Add Item
              </button>

              <div className="g-inset" style={{ padding:"12px 14px", marginBottom:20 }}>
                <p className="section-label" style={{ marginBottom:8 }}>Recalculated Totals</p>
                {[
                  ["Subtotal",              `₹${fmt(editSubtotal)}`,         "var(--text-1)"],
                  [`GST (${editGstRate}%)`, `₹${fmt(editGst)}`,              "var(--text-2)"],
                  ["Grand Total",           `₹${fmt(editTotal)}`,             "var(--blue)"],
                  ["Paid",                  `₹${fmt(form.paid||0)}`,          "var(--green)"],
                  ["Due",                   `₹${fmt(editTotal-(form.paid||0))}`,
                    (editTotal-(form.paid||0))>0?"var(--red)":"var(--text-3)"],
                ].map(([k,v,c]) => (
                  <div key={k as string} style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                    <span style={{ color:"var(--text-2)" }}>{k}</span>
                    <span style={{ fontWeight:600, color:c as string, fontFamily:"'DM Mono',monospace" }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button className="btn btn-primary" style={{ flex:2 }} disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const res = await fetch("/api/sales/update", {
                        method:"POST", credentials:"include",
                        headers:{ "Content-Type":"application/json" },
                        body: JSON.stringify({ id:editing._id, update:form }),
                      });
                      const d = await res.json();
                      if (d.success) { setEditing(null); loadSales(); }
                    } finally { setSaving(false); }
                  }}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button className="btn" style={{ flex:1 }} onClick={previewForm}>
                  <PrintIcon /> Preview &amp; Print
                </button>
                <button className="btn" style={{ flex:1 }} onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}