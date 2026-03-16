"use client";

import { useEffect, useRef, useState } from "react";

type Item = {
  productId: string;
  label:     string;
  qty:       number | "";
  price:     number | "";
};

type StockCheck = {
  productId:          string;
  productName:        string;
  requested:          number;
  available:          number;
  shortage:           number;
  canFulfill:         boolean;
  hasBom:             boolean;
  canProduceUnits:    number;
  rawShortages:       any[];
  canAutoProduceFull: boolean;
};

const fmt = (v: number) => Math.round(v || 0).toLocaleString("en-IN");

export default function BillPage() {
  const [inventory,   setInventory]   = useState<any[]>([]);
  const [customers,   setCustomers]   = useState<string[]>([]);
  const [customer,    setCustomer]    = useState("");
  const [address,     setAddress]     = useState("");
  const [invoice,     setInvoice]     = useState("");
  const [note,        setNote]        = useState("");
  const [billDate,    setBillDate]    = useState("");
  const [today,       setToday]       = useState("");
  const [paid,        setPaid]        = useState("");
  const [paidDate,    setPaidDate]    = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [cgst,        setCgst]        = useState("");
  const [sgst,        setSgst]        = useState("");
  const [igst,        setIgst]        = useState("");
  const [items,       setItems]       = useState<Item[]>([
    { productId:"", label:"", qty:"", price:"" },
  ]);
  const [saving,       setSaving]      = useState(false);
  const [saved,        setSaved]       = useState(false);
  const [error,        setError]       = useState("");
  const [stockChecks,  setStockChecks] = useState<StockCheck[]>([]);
  const [producing,    setProducing]   = useState<string | null>(null); // productId being auto-produced
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const iso = new Date().toISOString().slice(0, 10);
    setBillDate(iso);
    setToday(new Date(iso).toLocaleDateString("en-IN"));
    fetch("/api/inventory", { credentials:"include" })
      .then(r => r.json()).then(d => setInventory(Array.isArray(d) ? d : []));
    fetch("/api/sales", { credentials:"include" })
      .then(r => r.json())
      .then(data => {
        const unique = Array.from(new Set(
          (data||[]).map((s:any) => s.customer).filter((c:string) => c?.trim())
        )) as string[];
        setCustomers(unique);
      });
    fetch(`/api/sales/next?customDate=${iso}`, { credentials:"include" })
      .then(r => r.json()).then(d => setInvoice(d.invoice || "A001"));
  }, []);

  useEffect(() => {
    if (!billDate) return;
    setToday(new Date(billDate).toLocaleDateString("en-IN"));
    fetch(`/api/sales/next?customDate=${billDate}`, { credentials:"include" })
      .then(r => r.json()).then(d => setInvoice(d.invoice || invoice));
  }, [billDate]); // eslint-disable-line

  /* Debounced stock check whenever items change */
  useEffect(() => {
    clearTimeout(checkTimeout.current);
    const valid = items.filter(i => i.productId && Number(i.qty) > 0);
    if (!valid.length) { setStockChecks([]); return; }

    checkTimeout.current = setTimeout(async () => {
      const res = await fetch("/api/bom/check", {
        method:"POST", credentials:"include",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ items: valid.map(i => ({ productId:i.productId, qty:Number(i.qty) })) }),
      });
      const data = await res.json();
      if (Array.isArray(data)) setStockChecks(data);
    }, 600);
  }, [items]);

  const addRow    = () => setItems(prev => [...prev, { productId:"", label:"", qty:"", price:"" }]);
  const removeRow = (idx: number) => setItems(prev => prev.filter((_,i) => i !== idx));

  const selectProduct = (i: number, id: string) => {
    const p = inventory.find(x => x._id === id);
    if (!p) return;

    const label = `${p.name} | ${p.color} | ${p.type} | ${p.packing}`;

    setItems(prev => {
      const c = [...prev];
      c[i] = p
        ? { ...c[i], productId:id, label:[p.name,p.color,p.type,p.packing].filter(Boolean).join(" | "), price:p.price }
        : { ...c[i], productId:id };
      return c;
    });
  };

  const updateItem = (idx: number, key: keyof Item, val: any) =>
    setItems(prev => { const c=[...prev]; c[idx]={...c[idx],[key]:val}; return c; });

  const subtotal   = items.reduce((t,i) => t + Number(i.qty||0)*Number(i.price||0), 0);
  const gstRate    = (+cgst||0)+(+sgst||0)+(+igst||0);
  const gst        = subtotal*(gstRate/100);
  const total      = subtotal+gst;
  const paidAmount = Number(paid||0);
  const due        = total-paidAmount;

  const printRows = [...items];
  while (printRows.length < 10) printRows.push({ productId:"", label:"", qty:"", price:"" });

  /* Auto-produce a product from its BOM */
  const autoProduceItem = async (check: StockCheck) => {
    setProducing(check.productId);
    try {
      const res = await fetch("/api/production/auto-start", {
        method:"POST", credentials:"include",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          finishedProductId: check.productId,
          qtyNeeded:         check.shortage,
          invoiceRef:        invoice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✓ Production batch ${data.batchNo} created!\n${check.shortage}x ${check.productName} will be added to stock once the batch is marked complete in Production.`);
        // Refresh inventory
        fetch("/api/inventory", { credentials:"include" })
          .then(r => r.json()).then(d => setInventory(Array.isArray(d) ? d : []));
      } else {
        const shorts = (data.shortages || []).map((s:any) =>
          `• ${s.name}: need ${s.needed}, have ${s.available}`).join("\n");
        alert(`Cannot produce — raw material shortage:\n${shorts}`);
      }
    } finally { setProducing(null); }
  };

  const printInvoice = async () => {
    if (!customer.trim()) { setError("Customer name is required"); return; }
    if (!invoice.trim())  { setError("Invoice number is required"); return; }
    if (items.every(i => !i.productId)) { setError("Add at least one product"); return; }

    // Block if critical stock shortages exist with no BOM solution
    const blockers = stockChecks.filter(c => !c.canFulfill && !c.canAutoProduceFull && c.available === 0);
    if (blockers.length > 0) {
      const names = blockers.map(b => b.productName).join(", ");
      const go = confirm(`⚠ No stock available for: ${names}\n\nSave bill anyway? (Pending orders will be created)`);
      if (!go) return;
    }

    if (saving) return;
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/inventory/deduct", {
        method:"POST", credentials:"include",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          invoice, customer, address, note, paymentMode,
          cgst:+cgst||0, sgst:+sgst||0, igst:+igst||0,
          paid:paidAmount, paidDate,
          items: items
            .filter(i => i.productId && Number(i.qty) > 0)
            .map(i => ({ productId:i.productId, qty:Number(i.qty) })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.message || "Failed to save bill"); return; }
      setSaved(true);
      setTimeout(() => { window.print(); setSaved(false); }, 300);
    } catch { setError("Network error — please try again"); }
    finally { setSaving(false); }
  };

  /* Stock alert banner per line item */
  const getStockCheck = (productId: string) =>
    stockChecks.find(c => c.productId === productId);

  return (
    <>
      <style>{`
        .no-spin::-webkit-inner-spin-button,
        .no-spin::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spin { -moz-appearance: textfield; }
        @media print {
          @page { size: A5 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          #kapis-bill-invoice, #kapis-bill-invoice * { visibility: visible !important; }
          #kapis-bill-invoice {
            position: fixed !important; top:0; left:0;
            width:148mm !important; min-height:210mm !important;
            margin:0 !important; padding:8mm !important;
            background:#fff !important; color:#000 !important;
            border:none !important; box-shadow:none !important;
          }
          .bill-print-hidden { display:none !important; }
        }
      `}</style>

      <div className="fade-in" style={{ display:"flex", gap:28, alignItems:"flex-start" }}>

        {/* ── LEFT PANEL ───────────────────────────────────── */}
        <div className="bill-print-hidden" style={{ width:420, flexShrink:0, display:"flex", flexDirection:"column", gap:14 }}>
          <h1 className="page-title">Billing</h1>

          {/* Customer */}
          <div className="g-card" style={{ padding:"16px 18px" }}>
            <p className="section-label">Customer Details</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div className="field">
                <label className="field-label">Customer Name</label>
                <input list="clist" className="input" placeholder="Select or type name"
                  value={customer} onChange={e => setCustomer(e.target.value)} />
                <datalist id="clist">
                  {customers.map((c,i) => <option key={i} value={c} />)}
                </datalist>
              </div>
              <div className="field">
                <label className="field-label">Address</label>
                <textarea className="input" placeholder="Billing address" value={address}
                  onChange={e => setAddress(e.target.value)} style={{ height:60 }} />
              </div>
              <div className="field">
                <label className="field-label">Note</label>
                <textarea className="input" placeholder="Optional note" value={note}
                  onChange={e => setNote(e.target.value)} style={{ height:48 }} />
              </div>
            </div>
          </div>

          {/* Invoice */}
          <div className="g-card" style={{ padding:"16px 18px" }}>
            <p className="section-label">Invoice Details</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div className="field">
                <label className="field-label">Invoice No.</label>
                <input className="input" value={invoice} onChange={e => setInvoice(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Bill Date</label>
                <input type="date" className="input" value={billDate} onChange={e => setBillDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* GST */}
          <div className="g-card" style={{ padding:"16px 18px" }}>
            <p className="section-label">GST</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {([["CGST %",cgst,setCgst],["SGST %",sgst,setSgst],["IGST %",igst,setIgst]] as const).map(([l,v,s]) => (
                <div className="field" key={l}>
                  <label className="field-label">{l}</label>
                  <input type="number" className="input no-spin" placeholder="0"
                    value={v} onChange={e => s(e.target.value)} min={0} max={50} />
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="g-card" style={{ padding:"16px 18px" }}>
            <p className="section-label">Payment</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              <div className="field">
                <label className="field-label">Paid Amount</label>
                <input type="number" className="input no-spin" placeholder="0"
                  value={paid} onChange={e => setPaid(e.target.value)} min={0} />
              </div>
              <div className="field">
                <label className="field-label">Paid Date</label>
                <input type="date" className="input" value={paidDate} onChange={e => setPaidDate(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Mode</label>
                <select className="input" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="g-card" style={{ padding:"16px 18px" }}>
            <p className="section-label">Products</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {items.map((item,idx) => {
                const check = getStockCheck(item.productId);
                return (
                  <div key={idx}>
                    {/* Row */}
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr auto", gap:8 }}>
                      <select className="input" value={item.productId}
                        onChange={e => selectProduct(idx, e.target.value)}>
                        <option value="">Select product</option>
                        {inventory.filter(p => p.type==="finished").map(p => (
                          <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock})</option>
                        ))}
                      </select>
                      <input type="number" className="input no-spin" placeholder="Qty" value={item.qty}
                        onChange={e => updateItem(idx,"qty", e.target.value===""?"":+e.target.value)} min={0} />
                      <input type="number" className="input no-spin" placeholder="Price" value={item.price}
                        onChange={e => updateItem(idx,"price", e.target.value===""?"":+e.target.value)} min={0} />
                      <button className="btn btn-danger btn-icon btn-sm" style={{ alignSelf:"center" }}
                        onClick={() => removeRow(idx)}>✕</button>
                    </div>

                    {/* Stock alert for this item */}
                    {check && !check.canFulfill && (
                      <div style={{
                        marginTop:6, padding:"10px 12px",
                        background: check.canAutoProduceFull ? "var(--amber-dim)" : "var(--red-dim)",
                        border: `1px solid ${check.canAutoProduceFull ? "var(--amber-border)" : "var(--red-border)"}`,
                        borderRadius:8, fontSize:12,
                      }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                          <div>
                            <p style={{ fontWeight:600, color: check.canAutoProduceFull ? "var(--amber)" : "var(--red)", marginBottom:3 }}>
                              {check.canAutoProduceFull ? "⚠ Insufficient stock — can auto-produce" : "✗ Insufficient stock"}
                            </p>
                            <p style={{ color:"var(--text-2)", lineHeight:1.5 }}>
                              Available: <strong>{check.available}</strong> · Requested: <strong>{check.requested}</strong> · Short by: <strong style={{ color:"var(--red)" }}>{check.shortage}</strong>
                            </p>
                            {check.canAutoProduceFull && (
                              <p style={{ color:"var(--amber)", marginTop:3 }}>
                                Raw materials sufficient to produce {check.canProduceUnits} units
                              </p>
                            )}
                            {!check.canAutoProduceFull && check.rawShortages.length > 0 && (
                              <div style={{ marginTop:4 }}>
                                <p style={{ color:"var(--red)", marginBottom:2 }}>Raw material shortages:</p>
                                {check.rawShortages.map((r,i) => (
                                  <p key={i} style={{ color:"var(--text-2)", fontSize:11 }}>
                                    • {r.name}: have {r.have}, need {r.need}
                                  </p>
                                ))}
                              </div>
                            )}
                            {!check.hasBom && (
                              <p style={{ color:"var(--text-3)", marginTop:3, fontSize:11 }}>
                                No BOM defined — go to BOM page to set raw material recipe
                              </p>
                            )}
                          </div>
                          {check.canAutoProduceFull && (
                            <button
                              className="btn btn-warning btn-sm"
                              style={{ flexShrink:0, whiteSpace:"nowrap" }}
                              disabled={producing === check.productId}
                              onClick={() => autoProduceItem(check)}
                            >
                              {producing === check.productId ? "Starting…" : "Auto Produce"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* All good */}
                    {check && check.canFulfill && (
                      <div style={{ marginTop:4, display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:10, color:"var(--green)" }}>✓</span>
                        <span style={{ fontSize:11, color:"var(--text-3)" }}>
                          {check.available} in stock — sufficient
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              <button className="btn btn-sm" style={{ alignSelf:"flex-start" }} onClick={addRow}>
                + Add Row
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="g-inset" style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:7 }}>
            {[
              ["Subtotal",          `₹${fmt(subtotal)}`,   "var(--text-1)"],
              [`GST (${gstRate}%)`, `₹${fmt(gst)}`,        "var(--text-2)"],
              ["Paid",              `₹${fmt(paidAmount)}`, "var(--green)"],
              ["Due",               `₹${fmt(due)}`,        due>0?"var(--red)":"var(--text-3)"],
            ].map(([k,v,c]) => (
              <div key={k as string} style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                <span style={{ color:"var(--text-2)" }}>{k}</span>
                <span style={{ fontWeight:600, color:c as string, fontFamily:"'DM Mono',monospace" }}>{v}</span>
              </div>
            ))}
            <hr className="divider" style={{ margin:"2px 0" }} />
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:700 }}>
              <span>Total</span>
              <span style={{ fontFamily:"'DM Mono',monospace", color:"var(--blue)" }}>₹{fmt(total)}</span>
            </div>
          </div>

          {error && (
            <div style={{ background:"var(--red-dim)", border:"1px solid var(--red-border)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"var(--red)", display:"flex", gap:8, alignItems:"center" }}>
              <span>⚠</span>{error}
            </div>
          )}

          <button className="btn btn-primary" onClick={printInvoice} disabled={saving}
            style={{ height:44, fontSize:14, fontWeight:600 }}>
            {saving?"Saving…":saved?"✓ Saved — Printing…":"Save & Print Invoice"}
          </button>
        </div>

        {/* ── INVOICE PREVIEW ──────────────────────────────── */}
        <div id="kapis-bill-invoice" style={{
          width:"148mm", minHeight:"210mm", padding:"8mm",
          border:"1.5px solid #333", background:"#fff", color:"#111",
          fontSize:"12px", fontFamily:"'DM Sans','Arial',sans-serif",
          boxSizing:"border-box", display:"flex", flexDirection:"column", flexShrink:0,
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

          {/* Customer row */}
          <div style={{ border:"1px solid #ccc", padding:"5px 8px", display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:11 }}>
            <div>
              <div style={{ fontWeight:700 }}>To: {customer||"———"}</div>
              {address && <div style={{ marginTop:2, color:"#444", fontSize:10 }}>{address}</div>}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10 }}>Date: {today}</div>
              <div style={{ fontWeight:700 }}>Invoice: {invoice}</div>
            </div>
          </div>

          {/* Items table */}
          <div style={{ overflow:"hidden", borderBottom:"1px solid #ccc" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed" }}>
              <thead>
                <tr style={{ borderTop:"1px solid #ccc", borderBottom:"1px solid #ccc" }}>
                  {[["7%","Sr."],["43%","Product"],["13%","Qty"],["17%","Price"],["20%","Sub Total"]].map(([w,h]) => (
                    <th key={h as string} style={{ width:w as string, padding:"3px 5px", textAlign:"center", fontSize:11, fontWeight:700, borderLeft:"1px solid #ccc", borderRight:"1px solid #ccc" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {printRows.map((item,idx) => (
                  <tr key={idx} style={{ height:"10.5mm" }}>
                    <td style={{ textAlign:"center", borderLeft:"1px solid #ccc", borderRight:"1px solid #ccc", padding:"2px 4px", fontSize:10 }}>{item.label?idx+1:""}</td>
                    <td style={{ textAlign:"left", borderLeft:"1px solid #ccc", borderRight:"1px solid #ccc", padding:"2px 6px", fontSize:10 }}>{item.label||""}</td>
                    <td style={{ textAlign:"center", borderLeft:"1px solid #ccc", borderRight:"1px solid #ccc", padding:"2px 4px", fontSize:10 }}>{item.qty||""}</td>
                    <td style={{ textAlign:"center", borderLeft:"1px solid #ccc", borderRight:"1px solid #ccc", padding:"2px 4px", fontSize:10 }}>{item.price?`₹${item.price}`:""}</td>
                    <td style={{ textAlign:"center", borderLeft:"1px solid #ccc", borderRight:"1px solid #ccc", padding:"2px 4px", fontSize:10 }}>
                      {item.qty&&item.price?`₹${Number(item.qty)*Number(item.price)}`:""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ flex:1, minHeight:4 }} />

          {note && (
            <div style={{ borderTop:"1px solid #ddd", padding:"4px 2px", marginBottom:4, fontSize:10, color:"#333", lineHeight:1.5, wordBreak:"break-word" }}>
              <strong>NOTE:</strong> {note}
            </div>
          )}

          <div style={{ borderTop:"1px solid #bbb", paddingTop:5, display:"flex", justifyContent:"space-between", fontSize:11 }}>
            <div style={{ border:"1px solid #ccc", padding:"5px 8px", width:"52%", lineHeight:1.85 }}>
              <div>Subtotal: ₹{fmt(subtotal)}</div>
              {gstRate>0 && <div>GST ({gstRate}%): ₹{fmt(gst)}</div>}
              <div>Paid: ₹{fmt(paidAmount)}{paidDate?` (${new Date(paidDate).toLocaleDateString("en-GB")})`:""}</div>
              <div>Due: ₹{fmt(due)}</div>
              <div style={{ fontWeight:700, borderTop:"1px solid #ccc", marginTop:3, paddingTop:3 }}>
                Total: ₹{fmt(total)}
              </div>
            </div>
            <div style={{ textAlign:"right", display:"flex", flexDirection:"column", justifyContent:"space-between", paddingBottom:2 }}>
              <div style={{ fontSize:9, color:"#555" }}>For KAPIS LIGHTS</div>
              <div style={{ borderTop:"1px solid #333", paddingTop:3, fontSize:9, marginTop:28, whiteSpace:"nowrap" }}>
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}