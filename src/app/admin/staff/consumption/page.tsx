"use client";

import { useEffect, useState } from "react";

export default function ProductionPage() {
  const [rawInventory,      setRaw]      = useState<any[]>([]);
  const [finishedInventory, setFinished] = useState<any[]>([]);
  const [batches,           setBatches]  = useState<any[]>([]);
  const [rawMaterials,      setRawMats]  = useState([{ productId: "", quantity: 0 }]);
  const [finishedProducts,  setFinProds] = useState([{ productId: "", quantity: 0 }]);
  const [date,              setDate]     = useState("");
  const [loading,           setLoading]  = useState(true);
  const [starting,          setStarting] = useState(false);

  const loadAll = async () => {
    try {
      const [invRes, batchRes] = await Promise.all([
        fetch("/api/inventory",      { credentials: "include" }),
        fetch("/api/production/list", { credentials: "include" }),
      ]);
      const inv     = await invRes.json();
      const batches = await batchRes.json();
      const items   = Array.isArray(inv) ? inv : [];
      setRaw(     items.filter((i: any) => i.type === "raw"));
      setFinished(items.filter((i: any) => i.type === "finished"));
      setBatches( Array.isArray(batches) ? batches : []);
    } catch (err) {
      console.error("Load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const startProduction = async () => {
    if (starting) return;
    const validRaw = rawMaterials.filter(r => r.productId && r.quantity > 0);
    if (!validRaw.length) { alert("Add at least one raw material"); return; }
    setStarting(true);
    try {
      const res  = await fetch("/api/production/start", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawMaterials: validRaw, finishedProducts, date }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Batch Created: ${data.batchNo}`);
        setRawMats([{ productId: "", quantity: 0 }]);
        setFinProds([{ productId: "", quantity: 0 }]);
        setDate("");
        await loadAll();
      } else {
        alert(data.error || "Failed to start production");
      }
    } catch { alert("Network error"); }
    finally { setStarting(false); }
  };

  const markCompleted = async (id: string) => {
    try {
      await fetch("/api/production/complete", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: id }),
      });
      await loadAll();
    } catch { alert("Failed to mark completed"); }
  };

  const updateRaw = (idx: number, key: "productId" | "quantity", val: any) => {
    const copy = [...rawMaterials];
    copy[idx] = { ...copy[idx], [key]: val };
    setRawMats(copy);
  };

  const updateFin = (idx: number, key: "productId" | "quantity", val: any) => {
    const copy = [...finishedProducts];
    copy[idx] = { ...copy[idx], [key]: val };
    setFinProds(copy);
  };

  return (
    <div className="fade-in">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Production Batches</h1>
        <span className="badge badge-blue">
          {batches.filter(b => b.status !== "completed").length} active
        </span>
      </div>

      {/* ── Start production form ─────────────────────────── */}
      <div className="g-card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <p className="section-label">Start New Batch</p>

        {/* Date */}
        <div className="field" style={{ maxWidth: 220, marginBottom: 18 }}>
          <label className="field-label">Production Date</label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Raw Materials */}
        <div style={{ marginBottom: 18 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: "var(--amber)",
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
          }}>
            Raw Materials
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rawMaterials.map((rm, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8 }}>
                <div className="field">
                  <label className="field-label">Material</label>
                  <select
                    className="input"
                    value={rm.productId}
                    onChange={e => updateRaw(idx, "productId", e.target.value)}
                  >
                    <option value="">Select raw material</option>
                    {rawInventory.map(i => (
                      <option key={i._id} value={i._id}>
                        {i.name} (Stock: {i.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Qty</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    min={0}
                    value={rm.quantity || ""}
                    onChange={e => updateRaw(idx, "quantity", Number(e.target.value))}
                  />
                </div>
                <button
                  className="btn btn-danger btn-icon btn-sm"
                  style={{ alignSelf: "flex-end" }}
                  onClick={() => setRawMats(rawMaterials.filter((_, i) => i !== idx))}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              className="btn btn-sm"
              style={{ alignSelf: "flex-start" }}
              onClick={() => setRawMats([...rawMaterials, { productId: "", quantity: 0 }])}
            >
              + Add Raw Material
            </button>
          </div>
        </div>

        {/* Finished Products Output */}
        <div style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: "var(--green)",
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
          }}>
            Finished Products Output
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {finishedProducts.map((fp, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8 }}>
                <div className="field">
                  <label className="field-label">Product</label>
                  <select
                    className="input"
                    value={fp.productId}
                    onChange={e => updateFin(idx, "productId", e.target.value)}
                  >
                    <option value="">Select finished product</option>
                    {finishedInventory.map(i => (
                      <option key={i._id} value={i._id}>{i.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Qty</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    min={0}
                    value={fp.quantity || ""}
                    onChange={e => updateFin(idx, "quantity", Number(e.target.value))}
                  />
                </div>
                <button
                  className="btn btn-danger btn-icon btn-sm"
                  style={{ alignSelf: "flex-end" }}
                  onClick={() => setFinProds(finishedProducts.filter((_, i) => i !== idx))}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              className="btn btn-sm"
              style={{ alignSelf: "flex-start" }}
              onClick={() => setFinProds([...finishedProducts, { productId: "", quantity: 0 }])}
            >
              + Add Finished Product
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={startProduction}
          disabled={starting}
          style={{ minWidth: 180 }}
        >
          {starting ? "Creating Batch…" : "Start Production"}
        </button>
      </div>

      {/* ── Batch table ───────────────────────────────────── */}
      <div className="g-table">
        <table>
          <thead>
            <tr>
              <th>Batch</th>
              <th>Status</th>
              <th>Started</th>
              <th>Completed</th>
              <th>Raw Cost</th>
              <th>Output Qty</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                    <div className="spinner" />
                  </div>
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)" }}>
                  No production batches yet
                </td>
              </tr>
            ) : batches.map(b => (
              <tr key={b._id}>
                <td>
                  <span style={{
                    fontWeight: 600,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    color: b.source === "auto" ? "var(--amber)" : "var(--text-1)",
                  }}>
                    {b.batchNo}
                    {b.source === "auto" && (
                      <span className="badge badge-amber" style={{ marginLeft: 6, fontSize: 10 }}>AUTO</span>
                    )}
                  </span>
                </td>
                <td>
                  <span className={`badge ${b.status === "completed" ? "badge-green" : "badge-blue"}`}>
                    {b.status === "completed" ? "Completed" : "In Progress"}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {new Date(b.startedAt).toLocaleDateString()}
                </td>
                <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {b.completedAt ? new Date(b.completedAt).toLocaleDateString() : "—"}
                </td>
                <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                  {b.totalRawCost
                    ? `₹${Math.round(b.totalRawCost).toLocaleString("en-IN")}`
                    : "—"}
                </td>
                <td>{b.totalOutputQty ?? "—"}</td>
                <td>
                  {b.status !== "completed" && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => markCompleted(b._id)}
                    >
                      Mark Completed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}