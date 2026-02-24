"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [purchasing, setPurchasing] = useState<any | null>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);

  const [form, setForm] = useState({
    name: "",
    stock: "",
    price: "",
    hsn: "",
    color: "",
    type: "",
    packing: "",
  });

  const load = async () => {
    const res = await fetch("/api/inventory", { cache: "no-store" });
    const data = await res.json();

    // force new reference to avoid React stale state
    setItems([...data]);
  };

  useEffect(() => {
    load();
  }, []);

  const addItem = async () => {
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        stock: Number(form.stock),
        price: Number(form.price),
      }),
    });

    setForm({
      name: "",
      stock: "",
      price: "",
      hsn: "",
      color: "",
      type: "",
      packing: "",
    });

    load();
  };

  // ✅ FIXED UPDATE
  const update = async (id: string, data: any) => {
    const { _id, ...clean } = data;

    await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        ...clean,
        stock: Number(clean.stock),
        price: Number(clean.price),
      }),
    });

    await load();
  };

  const remove = async (id: string) => {
    await fetch("/api/inventory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    load();
  };

  const exportExcel = () => {
    const data = items.filter(i =>
      selected.includes(i._id)
    );

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "inventory.xlsx");
  };

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-semibold">Inventory</h2>

      {/* ADD FORM */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-4 grid grid-cols-4 gap-3">

        {Object.entries(form).map(([k, v]) => (
          <input
            key={k}
            placeholder={k}
            value={v}
            onChange={e =>
              setForm({ ...form, [k]: e.target.value })
            }
            className="input"
          />
        ))}

        <button onClick={addItem} className="btn bg-blue-600">
          Add Product
        </button>

      </div>

      <button onClick={exportExcel} className="btn bg-green-600">
        Export Selected
      </button>

      {/* TABLE */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="border-b border-[var(--border)] bg-black/10">
            <tr>
              <th className="p-3">Select</th>
              <th className="p-3">Name</th>
              <th className="p-3 text-center">Stock</th>
              <th className="p-3 text-center">HSN</th>
              <th className="p-3 text-center">Color</th>
              <th className="p-3 text-center">Type</th>
              <th className="p-3 text-center">Packing</th>
              <th className="p-3 text-center">Price</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map(i => (
              <tr
                key={i._id}
                className={`border-b border-[var(--border)] ${
                  i.stock < 5 ? "bg-red-500/10" : ""
                }`}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(i._id)}
                    onChange={e =>
                      setSelected(prev =>
                        e.target.checked
                          ? [...prev, i._id]
                          : prev.filter(x => x !== i._id)
                      )
                    }
                  />
                </td>

                <td className="p-3">{i.name}</td>
                <td className="p-3 text-center font-semibold">{i.stock}</td>
                <td className="p-3 text-center">{i.hsn}</td>
                <td className="p-3 text-center">{i.color}</td>
                <td className="p-3 text-center">{i.type}</td>
                <td className="p-3 text-center">{i.packing}</td>
                <td className="p-3 text-center">₹{i.price}</td>

                <td className="p-3 flex gap-2 justify-center">

                  <button
                    onClick={() => setPurchasing(i)}
                    className="px-3 py-1 rounded bg-green-600 text-white text-xs"
                  >
                    Purchase
                  </button>

                  <button
                    onClick={() => setEditing(i)}
                    className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
                  >
                    Update
                  </button>

                  <button
                    onClick={() => remove(i._id)}
                    className="px-3 py-1 rounded bg-red-600 text-white text-xs"
                  >
                    Delete
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

          <div className="bg-[var(--panel)] p-6 rounded-xl w-[400px] space-y-3">

            <h3 className="font-semibold">Edit Product</h3>

            {["name","stock","price","hsn","color","type","packing"].map(k => (
              <input
                key={k}
                value={editing[k]}
                onChange={e =>
                  setEditing({ ...editing, [k]: e.target.value })
                }
                className="input w-full"
              />
            ))}

            <button
              onClick={async () => {
                await update(editing._id, editing);
                setEditing(null);
              }}
              className="btn bg-blue-600 w-full"
            >
              Save
            </button>

          </div>
        </div>
      )}

      {/* PURCHASE MODAL */}
      {purchasing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

          <div className="bg-[var(--panel)] p-6 rounded-xl w-[300px] space-y-3">

            <h3 className="font-semibold">Purchase Stock</h3>

            <input
              type="number"
              value={purchaseQty}
              onChange={e => setPurchaseQty(+e.target.value)}
              className="input w-full"
            />

            <button
              onClick={async () => {
                await update(purchasing._id, {
                  ...purchasing,
                  stock: purchasing.stock + purchaseQty,
                });
                setPurchasing(null);
              }}
              className="btn bg-green-600 w-full"
            >
              Add Stock
            </button>

          </div>
        </div>
      )}

    </div>
  );
}