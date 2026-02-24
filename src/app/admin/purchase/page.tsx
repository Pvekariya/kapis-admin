"use client";

import { useEffect, useState } from "react";

export default function PurchasePage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [supplier, setSupplier] = useState("");
  const [invoice, setInvoice] = useState("");

  const [items, setItems] = useState([
    { productId: "", qty: "", price: "" },
  ]);

  useEffect(() => {
    fetch("/api/inventory")
      .then(res => res.json())
      .then(setInventory);
  }, []);

  const addRow = () =>
    setItems([...items, { productId: "", qty: "", price: "" }]);

  const update = (i: number, key: string, val: any) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [key]: val };
    setItems(copy);
  };

  const total = items.reduce(
    (t, i) => t + Number(i.qty || 0) * Number(i.price || 0),
    0
  );

  const savePurchase = async () => {
    const res = await fetch("/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice,
        supplier,
        items,
        total,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Purchase saved");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">

      <h2 className="text-2xl font-semibold">
        Purchase Entry
      </h2>

      <input
        placeholder="Supplier name"
        value={supplier}
        onChange={e => setSupplier(e.target.value)}
        className="input w-64"
      />

      <input
        placeholder="Invoice"
        value={invoice}
        onChange={e => setInvoice(e.target.value)}
        className="input w-48"
      />

      <div className="border p-4 rounded space-y-2">
        {items.map((i, idx) => (
          <div key={idx} className="flex gap-2">

            <select
              value={i.productId}
              onChange={e => update(idx, "productId", e.target.value)}
              className="input"
            >
              <option value="">Product</option>
              {inventory.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Qty"
              value={i.qty}
              onChange={e => update(idx, "qty", e.target.value)}
              className="input"
            />

            <input
              type="number"
              placeholder="Price"
              value={i.price}
              onChange={e => update(idx, "price", e.target.value)}
              className="input"
            />

          </div>
        ))}

        <button onClick={addRow} className="btn">
          + Add Row
        </button>
      </div>

      <p className="text-lg font-bold">
        Total: ₹{total}
      </p>

      <button
        onClick={savePurchase}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Purchase
      </button>
    </div>
  );
}