"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import * as XLSX from "xlsx";

export default function InventoryPage() {
  const pathname = usePathname();
  const inventoryType = pathname.includes("/raw") ? "raw" : "finished";

  const [items, setItems]           = useState<any[]>([]);
  const [selected, setSelected]     = useState<string[]>([]);
  const [editing, setEditing]       = useState<any | null>(null);
  const [purchasing, setPurchasing] = useState<any | null>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "", stock: "", price: "", hsn: "", color: "", packing: "",
  });

  const load = async () => {
    const res  = await fetch("/api/inventory", { credentials: "include" });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addItem = async () => {
    if (!form.name.trim()) return;
    await fetch("/api/inventory", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form, type: inventoryType,
        stock: Number(form.stock), price: Number(form.price),
      }),
    });
    setForm({ name: "", stock: "", price: "", hsn: "", color: "", packing: "" });
    load();
  };

  const update = async (id: string, data: any) => {
    const { _id, ...clean } = data;
    await fetch("/api/inventory", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...clean, stock: Number(clean.stock), price: Number(clean.price) }),
    });
    load();
  };

  // ✅ FIX: use startTransition so confirm() + fetch don't block INP
  const remove = (id: string) => {
    startTransition(async () => {
      const yes = window.confirm("Delete this item?");
      if (!yes) return;
      setDeletingId(id);
      try {
        await fetch("/api/inventory", {
          method: "DELETE", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        await load();
      } finally {
        setDeletingId(null);
      }
    });
  };

  const exportExcel = () => {
    const rows = items.filter(i => i.type === inventoryType && selected.includes(i._id));
    if (!rows.length) { alert("Select items to export first"); return; }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `${inventoryType}-inventory.xlsx`);
  };

  const filtered   = items.filter(i => i.type === inventoryType);
  const totalValue = filtered.reduce((s, i) => s + Number(i.stock) * Number(i.price), 0);
  const lowCount   = filtered.filter(i => Number(i.stock) < 5).length;
  const allChecked = selected.length === filtered.length && filtered.length > 0;

  const FIELDS: [string, string][] = [
    ["Name", "name"], ["Stock", "stock"], ["Price", "price"],
    ["HSN", "hsn"], ["Color", "color"], ["Packing", "packing"],
  ];

  return (
    <div className="fade-in">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">
          {inventoryType === "raw" ? "Raw Materials" : "Finished Products"}
        </h1>
        <button className="btn" onClick={exportExcel}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Selected
        </button>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="stat-card sc-blue">
          <div className="sc-border" /><div className="sc-glow" />
          <p className="sc-label">Total Inventory Value</p>
          <p className="sc-value">₹{Math.round(totalValue).toLocaleString("en-IN")}</p>
        </div>
        <div className="stat-card sc-red">
          <div className="sc-border" /><div className="sc-glow" />
          <p className="sc-label">Low Stock Items (&lt; 5)</p>
          <p className="sc-value">{lowCount}</p>
          {lowCount === 0 && <p className="sc-sub">All stock levels healthy</p>}
        </div>
      </div>

      {/* ── Add product form ─────────────────────────────────── */}
      <div className="g-card" style={{ padding: "18px 20px", marginBottom: 20 }}>
        <p className="section-label">Add Product</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr auto",
          gap: 10, alignItems: "end",
        }}>
          {FIELDS.map(([placeholder, key]) => (
            <div className="field" key={key}>
              <label className="field-label">{placeholder}</label>
              <input
                className="input" placeholder={placeholder}
                value={(form as any)[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                type={key === "stock" || key === "price" ? "number" : "text"}
                min={0}
              />
            </div>
          ))}
          <button className="btn btn-primary" onClick={addItem} style={{ alignSelf: "end" }}>
            Add
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="g-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <input
                  type="checkbox" checked={allChecked}
                  onChange={e => setSelected(e.target.checked ? filtered.map(i => i._id) : [])}
                  style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                />
              </th>
              <th>Name</th><th>Stock</th><th>HSN</th>
              <th>Color</th><th>Packing</th><th>Price</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}>
                <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                  <div className="spinner" />
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)" }}>
                No products yet — add one above
              </td></tr>
            ) : filtered.map(i => {
              const isLow = Number(i.stock) < 5;
              const isDeleting = deletingId === i._id;
              return (
                <tr key={i._id} style={isLow ? { background: "var(--red-dim)" } : {}}>
                  <td>
                    <input
                      type="checkbox" checked={selected.includes(i._id)}
                      onChange={e => setSelected(prev =>
                        e.target.checked ? [...prev, i._id] : prev.filter(x => x !== i._id)
                      )}
                      style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                  </td>
                  <td style={{ fontWeight: 500 }}>{i.name}</td>
                  <td>
                    <span className={isLow ? "badge badge-red" : "badge badge-green"}>{i.stock}</span>
                  </td>
                  <td style={{ color: "var(--text-2)", fontSize: 12 }}>{i.hsn || "—"}</td>
                  <td>{i.color || "—"}</td>
                  <td style={{ color: "var(--text-2)" }}>{i.packing || "—"}</td>
                  <td style={{ fontWeight: 600, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
                    ₹{i.price}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => { setPurchaseQty(1); setPurchasing(i); }}
                      >
                        +Stock
                      </button>
                      <button className="btn btn-sm" onClick={() => setEditing({ ...i })}>
                        Edit
                      </button>
                      {/* ✅ FIX: onClick uses startTransition internally via remove() */}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => remove(i._id)}
                        disabled={isDeleting}
                        style={{ opacity: isDeleting ? 0.5 : 1, minWidth: 40 }}
                      >
                        {isDeleting ? "…" : "Del"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Edit modal ───────────────────────────────────────── */}
      {editing && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Product</h3>
              <button className="btn btn-icon btn-sm" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {FIELDS.map(([placeholder, key]) => (
                <div className="field" key={key}>
                  <label className="field-label">{placeholder}</label>
                  <input
                    className="input" placeholder={placeholder}
                    value={editing[key] ?? ""}
                    type={key === "stock" || key === "price" ? "number" : "text"}
                    onChange={e => setEditing({ ...editing, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={async () => { await update(editing._id, editing); setEditing(null); }}>
                Save changes
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add stock modal ──────────────────────────────────── */}
      {purchasing && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 340 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Stock</h3>
              <button className="btn btn-icon btn-sm" onClick={() => setPurchasing(null)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 14 }}>
              {purchasing.name}
              <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-3)" }}>
                current: {purchasing.stock} units
              </span>
            </p>
            <div className="field">
              <label className="field-label">Quantity to add</label>
              <input
                type="number" className="input"
                value={purchaseQty} min={1}
                onChange={e => setPurchaseQty(Math.max(1, +e.target.value))}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn btn-success" style={{ flex: 1 }}
                onClick={async () => {
                  await update(purchasing._id, {
                    ...purchasing,
                    stock: Number(purchasing.stock) + purchaseQty,
                  });
                  setPurchasing(null);
                }}>
                Add {purchaseQty} units
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setPurchasing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}