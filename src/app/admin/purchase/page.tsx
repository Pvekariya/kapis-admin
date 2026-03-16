"use client";

import { useEffect, useState } from "react";

type ProductType = "raw" | "finished";
type PaymentMode = "cash" | "upi" | "bank";

export default function PurchasePage() {
  const [inventory, setInventory]   = useState<any[]>([]);
  const [supplier, setSupplier]     = useState("");
  const [invoice, setInvoice]       = useState("");
  const [productType, setProductType] = useState<ProductType>("raw");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [showNewProduct, setShowNew]  = useState(false);
  const [newName, setNewName]         = useState("");
  const [newPrice, setNewPrice]       = useState("");
  const [saving, setSaving]           = useState(false);
  const [items, setItems]             = useState([{ productId:"", qty:"", price:"", customName:"" }]);

  const loadInventory = () =>
    fetch(`/api/inventory`, { credentials:"include" })
      .then(r => r.json())
      .then(d => setInventory(Array.isArray(d) ? d.filter((i:any) => i.type === productType) : []));

  useEffect(() => { loadInventory(); }, [productType]); // eslint-disable-line

  const updateItem = (i: number, key: string, val: any) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [key]: val };
    if (key === "productId" && val === "custom") setShowNew(true);
    setItems(copy);
  };

  const total = items.reduce((t, i) => t + Number(i.qty||0) * Number(i.price||0), 0);

  const saveNewProduct = async () => {
    if (!newName) return;
    await fetch("/api/inventory", {
      method:"POST", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ name:newName, type:productType, price:Number(newPrice||0), stock:0 }),
    });
    setShowNew(false); setNewName(""); setNewPrice("");
    loadInventory();
  };

  const savePurchase = async () => {
    if (!supplier || !invoice) return alert("Supplier and Invoice are required");
    if (saving) return;
    setSaving(true);
    try {
      const preparedItems = items
        .filter(i => i.productId && i.qty)
        .map(i => ({
          productId: i.productId !== "custom" ? i.productId : undefined,
          productName: inventory.find(p => p._id === i.productId)?.name || i.customName,
          qty: Number(i.qty), price: Number(i.price),
        }));
      if (!preparedItems.length) { alert("Add at least one item"); return; }
      const res  = await fetch("/api/purchase", {
        method:"POST", credentials:"include",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ invoice, supplier, productType, paymentMode, items:preparedItems, total }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Purchase saved");
        setSupplier(""); setInvoice("");
        setItems([{ productId:"", qty:"", price:"", customName:"" }]);
      } else { alert(data.error || "Failed to save"); }
    } finally { setSaving(false); }
  };

  return (
    <div className="fade-in" style={{ maxWidth:900, margin:"0 auto" }}>

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Purchase Entry</h1>
      </div>

      <div className="g-card" style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:16 }}>

        {/* Supplier + Invoice */}
        <div className="grid-2">
          <div className="field">
            <label className="field-label">Supplier Name</label>
            <input className="input" placeholder="Supplier name"
              value={supplier} onChange={e => setSupplier(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Invoice Number</label>
            <input className="input" placeholder="Invoice number"
              value={invoice} onChange={e => setInvoice(e.target.value)} />
          </div>
        </div>

        {/* Type + Payment */}
        <div className="grid-2">
          <div className="field">
            <label className="field-label">Product Type</label>
            <select className="input" value={productType}
              onChange={e => setProductType(e.target.value as ProductType)}>
              <option value="raw">Raw Materials</option>
              <option value="finished">Finished Products</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Payment Mode</label>
            <select className="input" value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as PaymentMode)}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank</option>
            </select>
          </div>
        </div>

        {/* Items */}
        <div>
          <p className="section-label">Items</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr auto", gap:8 }}>
                <select className="input" value={item.productId}
                  onChange={e => updateItem(idx, "productId", e.target.value)}>
                  <option value="">Select product</option>
                  {inventory.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                  <option value="custom">+ Add new product</option>
                </select>
                <input type="number" className="input" placeholder="Qty" value={item.qty}
                  onChange={e => updateItem(idx, "qty", e.target.value)} />
                <input type="number" className="input" placeholder="Price" value={item.price}
                  onChange={e => updateItem(idx, "price", e.target.value)} />
                <button className="btn btn-danger btn-icon"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}>✕</button>
              </div>
            ))}
            <button className="btn" style={{ alignSelf:"flex-start" }}
              onClick={() => setItems([...items, { productId:"", qty:"", price:"", customName:"" }])}>
              + Add Row
            </button>
          </div>
        </div>

        {/* New product panel */}
        {showNewProduct && (
          <div className="g-inset" style={{ padding:14 }}>
            <p className="section-label">New Product</p>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr auto", gap:10 }}>
              <div className="field">
                <label className="field-label">Product Name</label>
                <input className="input" placeholder="Product name"
                  value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Default Price</label>
                <input type="number" className="input" placeholder="0"
                  value={newPrice} onChange={e => setNewPrice(e.target.value)} />
              </div>
              <button className="btn btn-success" style={{ alignSelf:"flex-end" }}
                onClick={saveNewProduct}>Save</button>
            </div>
          </div>
        )}

        {/* Total + Save */}
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          paddingTop:16, borderTop:"1px solid var(--border)",
        }}>
          <div>
            <p style={{ fontSize:11, color:"var(--text-3)", marginBottom:2 }}>Total Amount</p>
            <p style={{ fontSize:22, fontWeight:700, color:"var(--green)", fontFamily:"'DM Mono',monospace" }}>
              ₹{total.toLocaleString("en-IN")}
            </p>
          </div>
          <button className="btn btn-primary" onClick={savePurchase} disabled={saving}
            style={{ minWidth:150 }}>
            {saving ? "Saving…" : "Save Purchase"}
          </button>
        </div>

      </div>
    </div>
  );
}