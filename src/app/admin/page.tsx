"use client";

import { useEffect, useState } from "react";
import Analytics from "./analytics";

type Insight = {
  lowStock: any[];
  deadStock: any[];
  newLeads: any[];
  orders: any[];
};

export default function Dashboard() {
  const [data, setData] = useState<Insight>({
    lowStock: [],
    deadStock: [],
    newLeads: [],
    orders: [],
  });

  const [modal, setModal] = useState<string | null>(null);

  const loadInsights = () => {
    fetch("/api/dashboard/insights", { cache: "no-store" })
      .then(async res => {
        if (!res.ok) throw new Error("API error");

        const text = await res.text();
        if (!text) throw new Error("Empty response");

        return JSON.parse(text);
      })
      .then(setData)
      .catch(() =>
        setData({
          lowStock: [],
          deadStock: [],
          newLeads: [],
          orders: [],
        })
      );
  };

  useEffect(() => {
    loadInsights();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">
        Smart Inventory Insights
      </h2>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        <Card
          title="Low Stock"
          value={data.lowStock.length}
          color="text-red-500"
          onClick={() => setModal("low")}
        />

        <Card
          title="Dead Stock"
          value={data.deadStock.length}
          color="text-yellow-500"
          onClick={() => setModal("dead")}
        />

        <Card
          title="New Leads Today"
          value={data.newLeads.length}
          color="text-green-500"
          onClick={() => setModal("leads")}
        />

        <Card
          title="Dealer Orders"
          value={data.orders.length}
          color="text-blue-500"
          onClick={() => setModal("orders")}
        />

      </div>

      {modal === "low" && (
        <Modal
          title="low"
          data={data.lowStock}
          onClose={() => setModal(null)}
          refresh={loadInsights}
        />
      )}

      {modal === "dead" && (
        <Modal
          title="dead"
          data={data.deadStock}
          onClose={() => setModal(null)}
          refresh={loadInsights}
        />
      )}

      {modal === "leads" && (
        <Modal
          title="leads"
          data={data.newLeads}
          onClose={() => setModal(null)}
          refresh={loadInsights}
        />
      )}

      {modal === "orders" && (
        <Modal
          title="orders"
          data={data.orders}
          onClose={() => setModal(null)}
          refresh={loadInsights}
        />
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">
          Business Analytics
        </h2>
        <Analytics />
      </div>
    </div>
  );
}

/* ---------- CARD ---------- */

function Card({
  title,
  value,
  color,
  onClick,
}: {
  title: string;
  value: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 shadow-sm cursor-pointer transition hover:scale-[1.04] hover:shadow-lg hover:border-blue-500"
    >
      <p className="text-sm opacity-70">{title}</p>
      <h3 className={'text-3xl mt-2 font-bold ${color}'}>
        {value}
      </h3>
    </div>
  );
}

/* ---------- MODAL ---------- */

function Modal({
  title,
  data,
  onClose,
  refresh,
}: {
  title: string;
  data: any[];
  onClose: () => void;
  refresh: () => void;
}) {
  if (!data.length) return null;

  const [qtyMap, setQtyMap] = useState<{ [k: string]: number }>({});

  let columns = Object.keys(data[0]).filter(
    k => k !== "_id" && k !== "id"
  );

  // custom column order for dealer orders
  if (title === "orders") {
    columns = ["buyer", "name", "color", "qty", "status", "priority", "createdAt"];
  }

  const orderNow = async (row: any) => {
    const qty = qtyMap[row.productId] || 1000;

    await fetch("/api/orders/from-low-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: row.productId,
        qty,
      }),
    });

    alert("Order placed");
    location.reload();
  };

  const markDone = async (row: any) => {
    try {
      let id =
        row._id?.$oid ??
        row._id?.toString?.() ??
        row._id ??
        row.id;

      if (!id) {
        console.log("ROW DEBUG:", row);
        alert("Missing order id");
        return;
      }

      id = String(id);

      const res = await fetch("/api/orders/done", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        alert(result.error || "Failed to complete order");
        return;
      }

      alert("Order completed & inventory updated");
      await refresh();
    } catch (err) {
      console.error("DONE ERROR:", err);
      alert("Failed to complete order");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl w-[900px] max-h-[550px] overflow-hidden shadow-2xl">

        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold capitalize text-lg">
            {title} Details
          </h3>

          <button
            onClick={onClose}
            className="px-4 py-1 rounded-lg border border-[var(--border)] hover:bg-white/5"
          >
            Close
          </button>
        </div>

        <div className="overflow-auto max-h-[460px]">
          <table className="w-full text-sm">

            <thead className="bg-black/20 sticky top-0">
              <tr>
                {columns.map(k => (
                  <th key={k} className="p-3 text-left border-b border-[var(--border)]">
                    {k}
                  </th>
                ))}
                {title === "low" && <th className="p-3 border-b border-[var(--border)]">Order</th>}
                {title === "orders" && (
                  <th className="p-3 border-b border-[var(--border)]">
                    Update
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border)]">

                  {columns.map((k, j) => (
                    <td key={j} className="p-3">
                      {k === "createdAt"
                        ? new Date(row[k]).toLocaleString()
                        : k === "name"
                        ? String(row.product || row.name || "-")
                        : k === "buyer"
                        ? String(row.buyer || "-")
                        : String(row[k] ?? "-")}
                    </td>
                  ))}

                  {title === "low" && (
                    <td className="p-3 flex gap-2">
                      <input
                        type="number"
                        placeholder="qty"
                        className="bg-black/40 px-2 py-1 rounded w-20"
                        onChange={e =>
                          setQtyMap(prev => ({
                            ...prev,
                            [row.productId]: Number(e.target.value),
                          }))
                        }
                      />

                      <button
                        onClick={() => orderNow(row)}
                        className="bg-blue-600 px-2 py-1 rounded text-xs"
                      >
                        Order
                      </button>
                    </td>
                  )}

                  {title === "orders" && (
                    <td className="p-3">
                      <button
                        onClick={() => markDone(row)}
                        className="bg-green-600 px-3 py-1 rounded text-xs hover:scale-105"
                      >
                        Done ✔
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
