"use client";

import { useEffect, useState } from "react";

export default function ProductionPage() {
  const [rawInventory, setRawInventory] = useState<any[]>([]);
  const [finishedInventory, setFinishedInventory] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  const [rawMaterials, setRawMaterials] = useState([
    { productId: "", quantity: 0 },
  ]);

  const [finishedProducts, setFinishedProducts] = useState([
    { productId: "", quantity: 0 },
  ]);

  const [date, setDate] = useState("");

  useEffect(() => {
    loadInventory();
    loadBatches();
  }, []);

  const loadInventory = async () => {
    const res = await fetch("/api/inventory");
    const data = await res.json();

    setRawInventory(data.filter((i: any) => i.type === "raw"));
    setFinishedInventory(data.filter((i: any) => i.type === "finished"));
  };

  const loadBatches = async () => {
    const res = await fetch("/api/production/list");
    const data = await res.json();
    setBatches(data || []);
  };

  const startProduction = async () => {
    const res = await fetch("/api/production/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawMaterials,
        finishedProducts,
        date,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert(`Batch Created: ${data.batchNo}`);
      setRawMaterials([{ productId: "", quantity: 0 }]);
      setFinishedProducts([{ productId: "", quantity: 0 }]);
      loadInventory();
      loadBatches();
    } else {
      alert(data.error);
    }
  };

  const markCompleted = async (id: string) => {
    await fetch("/api/production/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: id }),
    });

    loadInventory();
    loadBatches();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Production Batches</h2>

      {/* Create Batch */}
      <div className="bg-[var(--panel)] p-4 rounded-xl border space-y-4">
        <h3 className="font-semibold">Start Production</h3>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input"
        />

        <div>
          <h4 className="font-medium">Raw Materials</h4>
          {rawMaterials.map((rm, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <select
                className="input"
                value={rm.productId}
                onChange={(e) => {
                  const copy = [...rawMaterials];
                  copy[index].productId = e.target.value;
                  setRawMaterials(copy);
                }}
              >
                <option value="">Select Raw</option>
                {rawInventory.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} (Stock: {item.stock})
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Qty"
                className="input"
                value={rm.quantity}
                onChange={(e) => {
                  const copy = [...rawMaterials];
                  copy[index].quantity = Number(e.target.value);
                  setRawMaterials(copy);
                }}
              />
            </div>
          ))}

          <button
            className="btn border"
            onClick={() =>
              setRawMaterials([...rawMaterials, { productId: "", quantity: 0 }])
            }
          >
            + Add Raw
          </button>
        </div>

        <div>
          <h4 className="font-medium">Finished Products</h4>
          {finishedProducts.map((fp, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <select
                className="input"
                value={fp.productId}
                onChange={(e) => {
                  const copy = [...finishedProducts];
                  copy[index].productId = e.target.value;
                  setFinishedProducts(copy);
                }}
              >
                <option value="">Select Finished</option>
                {finishedInventory.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Qty"
                className="input"
                value={fp.quantity}
                onChange={(e) => {
                  const copy = [...finishedProducts];
                  copy[index].quantity = Number(e.target.value);
                  setFinishedProducts(copy);
                }}
              />
            </div>
          ))}

          <button
            className="btn border"
            onClick={() =>
              setFinishedProducts([
                ...finishedProducts,
                { productId: "", quantity: 0 },
              ])
            }
          >
            + Add Finished
          </button>
        </div>

        <button className="btn bg-blue-600" onClick={startProduction}>
          Start Production
        </button>
      </div>

      {/* Batch Table */}
      <div className="bg-[var(--panel)] rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="p-3">Batch</th>
              <th className="p-3">Status</th>
              <th className="p-3">Started</th>
              <th className="p-3">Completed</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b._id} className="border-b">
                <td className="p-3">{b.batchNo}</td>
                <td className="p-3">
                  {b.status === "completed" ? (
                    <span className="text-green-500">Completed</span>
                  ) : (
                    <span className="text-yellow-500">In Progress</span>
                  )}
                </td>
                <td className="p-3">
                  {new Date(b.startedAt).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {b.completedAt
                    ? new Date(b.completedAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="p-3">
                  {b.status !== "completed" && (
                    <button
                      className="btn bg-green-600"
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