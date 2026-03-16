"use client";

import { useEffect, useState } from "react";

export default function BomPage() {
  const [finishedProducts, setFinished]  = useState<any[]>([]);
  const [rawProducts,      setRaw]       = useState<any[]>([]);
  const [boms,             setBoms]      = useState<any[]>([]);
  const [selectedProduct,  setSelected]  = useState("");
  const [bomItems,         setBomItems]  = useState<{ rawProductId:string; qtyPerUnit:string }[]>([
    { rawProductId:"", qtyPerUnit:"" },
  ]);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [inv, b] = await Promise.all([
      fetch("/api/inventory", { credentials:"include" }).then(r => r.json()),
      fetch("/api/bom",       { credentials:"include" }).then(r => r.json()),
    ]);
    const items = Array.isArray(inv) ? inv : [];
    setFinished(items.filter((i:any) => i.type === "finished"));
    setRaw(     items.filter((i:any) => i.type === "raw"));
    setBoms(Array.isArray(b) ? b : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  /* When a finished product is selected, pre-fill existing BOM */
  useEffect(() => {
    if (!selectedProduct) { setBomItems([{ rawProductId:"", qtyPerUnit:"" }]); return; }
    const existing = boms.find(b => b.finishedProductId?.toString() === selectedProduct);
    if (existing?.items?.length) {
      setBomItems(existing.items.map((i:any) => ({
        rawProductId: i.rawProductId?.toString() ?? "",
        qtyPerUnit:   String(i.qtyPerUnit),
      })));
    } else {
      setBomItems([{ rawProductId:"", qtyPerUnit:"" }]);
    }
  }, [selectedProduct, boms]);

  const saveBom = async () => {
    if (!selectedProduct) return;
    const validItems = bomItems.filter(i => i.rawProductId && Number(i.qtyPerUnit) > 0);
    if (!validItems.length) return;
    setSaving(true);
    try {
      await fetch("/api/bom", {
        method:"POST", credentials:"include",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          finishedProductId: selectedProduct,
          items: validItems.map(i => ({ rawProductId:i.rawProductId, qtyPerUnit:Number(i.qtyPerUnit) })),
        }),
      });
      setSuccess("BOM saved successfully");
      setTimeout(() => setSuccess(""), 3000);
      load();
    } finally { setSaving(false); }
  };

  const deleteBom = async (fid: string) => {
    if (!confirm("Delete this BOM?")) return;
    await fetch(`/api/bom?finishedProductId=${fid}`, {
      method:"DELETE", credentials:"include",
    });
    load();
  };

  const getRawName = (id: string) =>
    rawProducts.find(r => r._id?.toString() === id?.toString())?.name ?? id;

  const getFinishedName = (id: string) =>
    finishedProducts.find(f => f._id?.toString() === id?.toString())?.name ?? id;

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Bill of Materials (BOM)</h1>
        <span className="badge badge-purple">{boms.length} BOMs defined</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

        {/* ── Left: Create / Edit BOM ──────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          <div className="g-card" style={{ padding:"18px 20px" }}>
            <p className="section-label">Define BOM</p>
            <p style={{ fontSize:12, color:"var(--text-2)", marginBottom:14, lineHeight:1.6 }}>
              Specify which raw materials (and how many per unit) are needed to produce one unit of a finished product.
            </p>

            {/* Select finished product */}
            <div className="field" style={{ marginBottom:14 }}>
              <label className="field-label">Finished Product</label>
              <select className="input" value={selectedProduct}
                onChange={e => setSelected(e.target.value)}>
                <option value="">Select finished product…</option>
                {finishedProducts.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Raw material rows */}
            {selectedProduct && (
              <>
                <p className="section-label" style={{ marginBottom:8 }}>Raw Materials Required (per 1 unit)</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                  {bomItems.map((item, idx) => (
                    <div key={idx} style={{ display:"grid", gridTemplateColumns:"2fr 1fr auto", gap:8 }}>
                      <div className="field">
                        <label className="field-label">Raw Material</label>
                        <select className="input" value={item.rawProductId}
                          onChange={e => {
                            const c=[...bomItems]; c[idx].rawProductId=e.target.value; setBomItems(c);
                          }}>
                          <option value="">Select raw material…</option>
                          {rawProducts.map(r => (
                            <option key={r._id} value={r._id}>
                              {r.name} (Stock: {r.stock})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label className="field-label">Qty / unit</label>
                        <input type="number" className="input" placeholder="0" min={0.01} step={0.01}
                          value={item.qtyPerUnit}
                          onChange={e => {
                            const c=[...bomItems]; c[idx].qtyPerUnit=e.target.value; setBomItems(c);
                          }} />
                      </div>
                      <button className="btn btn-danger btn-icon btn-sm" style={{ alignSelf:"flex-end" }}
                        onClick={() => setBomItems(bomItems.filter((_,i) => i !== idx))}>✕</button>
                    </div>
                  ))}
                  <button className="btn btn-sm" style={{ alignSelf:"flex-start" }}
                    onClick={() => setBomItems([...bomItems, { rawProductId:"", qtyPerUnit:"" }])}>
                    + Add Raw Material
                  </button>
                </div>

                {success && (
                  <div style={{ background:"var(--green-dim)", border:"1px solid var(--green-border)", borderRadius:8, padding:"8px 12px", fontSize:12, color:"var(--green)", marginBottom:10 }}>
                    ✓ {success}
                  </div>
                )}

                <button className="btn btn-primary" onClick={saveBom} disabled={saving} style={{ width:"100%" }}>
                  {saving ? "Saving…" : "Save BOM"}
                </button>
              </>
            )}
          </div>

          {/* Stock feasibility checker */}
          {selectedProduct && (
            <div className="g-card" style={{ padding:"18px 20px" }}>
              <p className="section-label">Current Stock Feasibility</p>
              {(() => {
                const fp = finishedProducts.find(f => f._id === selectedProduct);
                const bom = boms.find(b => b.finishedProductId?.toString() === selectedProduct);
                if (!bom?.items?.length) return (
                  <p style={{ fontSize:12, color:"var(--text-3)" }}>Save a BOM first to see feasibility.</p>
                );

                let maxUnits = Infinity;
                const rows: any[] = [];
                for (const item of bom.items) {
                  const raw = rawProducts.find(r => r._id?.toString() === item.rawProductId?.toString());
                  const have = Number(raw?.stock ?? 0);
                  const canMake = Math.floor(have / item.qtyPerUnit);
                  maxUnits = Math.min(maxUnits, canMake);
                  rows.push({ name:raw?.name ?? "?", have, needPer:item.qtyPerUnit, canMake });
                }
                if (maxUnits === Infinity) maxUnits = 0;

                return (
                  <>
                    <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                      <div className={`stat-card sc-${maxUnits > 0 ? "green":"red"}`} style={{ flex:1, padding:"12px 14px" }}>
                        <div className="sc-border"/><div className="sc-glow"/>
                        <p className="sc-label">Can produce now</p>
                        <p className="sc-value" style={{ fontSize:20 }}>{maxUnits} units</p>
                      </div>
                      <div className="stat-card sc-blue" style={{ flex:1, padding:"12px 14px" }}>
                        <div className="sc-border"/><div className="sc-glow"/>
                        <p className="sc-label">Finished in stock</p>
                        <p className="sc-value" style={{ fontSize:20 }}>{fp?.stock ?? 0}</p>
                      </div>
                    </div>
                    <div className="g-table">
                      <table>
                        <thead><tr><th>Raw Material</th><th>In Stock</th><th>Per Unit</th><th>Can Make</th></tr></thead>
                        <tbody>
                          {rows.map((r,i) => (
                            <tr key={i}>
                              <td style={{ fontWeight:500 }}>{r.name}</td>
                              <td><span className={`badge ${r.have > 0 ? "badge-green":"badge-red"}`}>{r.have}</span></td>
                              <td style={{ color:"var(--text-2)" }}>{r.needPer}</td>
                              <td style={{ fontWeight:600, color: r.canMake > 0 ? "var(--green)":"var(--red)" }}>{r.canMake}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Right: Existing BOMs ──────────────────────────── */}
        <div>
          <div className="g-card" style={{ padding:"18px 20px" }}>
            <p className="section-label" style={{ marginBottom:12 }}>Defined BOMs</p>
            {loading ? (
              <div style={{ display:"flex", justifyContent:"center", padding:24 }}><div className="spinner"/></div>
            ) : boms.length === 0 ? (
              <p style={{ fontSize:12, color:"var(--text-3)", padding:"16px 0" }}>No BOMs defined yet. Select a finished product on the left to start.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {boms.map(bom => {
                  const fp = finishedProducts.find(f => f._id?.toString() === bom.finishedProductId?.toString());
                  return (
                    <div key={bom._id} className="g-inset" style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div>
                          <p style={{ fontWeight:600, fontSize:13, color:"var(--text-1)" }}>
                            {fp?.name ?? "Unknown Product"}
                          </p>
                          <p style={{ fontSize:11, color:"var(--text-3)" }}>
                            Stock: {fp?.stock ?? 0} units
                          </p>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="btn btn-sm"
                            onClick={() => setSelected(bom.finishedProductId?.toString())}>
                            Edit
                          </button>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => deleteBom(bom.finishedProductId?.toString())}>
                            Delete
                          </button>
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                        {(bom.items ?? []).map((item:any, i:number) => {
                          const raw = rawProducts.find(r => r._id?.toString() === item.rawProductId?.toString());
                          return (
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                              <span style={{ color:"var(--text-2)" }}>{raw?.name ?? "?"}</span>
                              <span style={{ fontFamily:"'DM Mono',monospace", color:"var(--amber)" }}>
                                ×{item.qtyPerUnit} per unit
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}