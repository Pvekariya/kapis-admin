"use client";

import { useEffect, useState } from "react";
import Analytics from "./analytics";

type Insight = {
  lowStock: any[];
  deadStock: any[];
  newLeads: any[];
  orders: any[];
};

type WIPSummary = {
  activeCount: number;
  totalRawCost: number;
  totalOutputQty: number;
  avgCostPerUnit: number;
};

type InventoryItem = {
  _id: string;
  name: string;
  quantity: number;
  price?: number;
  costPrice?: number;
  type: "raw" | "finished";
};

export default function Dashboard() {
  const [data, setData] = useState<Insight>({
    lowStock: [],
    deadStock: [],
    newLeads: [],
    orders: [],
  });

  const [wipBatches, setWipBatches] = useState<any[]>([]);
  const [wipSummary, setWipSummary] = useState<WIPSummary>({
    activeCount: 0,
    totalRawCost: 0,
    totalOutputQty: 0,
    avgCostPerUnit: 0,
  });

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventorySummary, setInventorySummary] = useState({
    total: 0,
    raw: 0,
    finished: 0,
  });

  const [todaySummary, setTodaySummary] = useState({
    income: 0,
    expense: 0,
  });

  const [modal, setModal] = useState<string | null>(null);

  const formatCurrency = (val: number) =>
    Math.round(val || 0).toLocaleString("en-IN");

  const loadInsights = () => {
    fetch("/api/dashboard/insights", { cache: "no-store" })
      .then(res => res.json())
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

  const loadWIP = () => {
    fetch("/api/production/wip", { cache: "no-store" })
      .then(res => res.json())
      .then(res => {
        setWipBatches(res.batches || []);
        setWipSummary(res.summary || {});
      })
      .catch(() => {
        setWipBatches([]);
        setWipSummary({
          activeCount: 0,
          totalRawCost: 0,
          totalOutputQty: 0,
          avgCostPerUnit: 0,
        });
      });
  };

  const loadInventory = async () => {
    try {
      const res = await fetch("/api/inventory", { cache: "no-store" });
      const data = await res.json();

      // 🔥 Support multiple response shapes
      const items = Array.isArray(data)
        ? data
        : data.inventory || data.items || [];

      setInventory(items);

      let total = 0;
      let raw = 0;
      let finished = 0;

      items.forEach((item: any) => {
        const value =
          (Number(item.quantity) || 0) *
          (Number(item.costPrice) || Number(item.price) || 0);

        total += value;

        if (item.type === "raw") raw += value;
        if (item.type === "finished") finished += value;
      });

      setInventorySummary({ total, raw, finished });
    } catch (err) {
      console.error("Inventory load error", err);
      setInventory([]);
      setInventorySummary({ total: 0, raw: 0, finished: 0 });
    }
  };

  const loadTodayDaybook = async () => {
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const res = await fetch(
        `/api/daybook?from=${dateStr}&to=${dateStr}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      setTodaySummary({
        income: data.summary?.totalIncome || 0,
        expense: data.summary?.totalExpense || 0,
      });
    } catch (err) {
      setTodaySummary({ income: 0, expense: 0 });
    }
  };

  useEffect(() => {
    loadInsights();
    loadWIP();
    loadInventory();
    loadTodayDaybook();
  }, []);

  return (
    <div>
      {/* 📦 INVENTORY SECTION */}
      <h2 className="text-2xl font-semibold mb-6">
        Inventory Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <InfoCard
          title="Total Inventory Value"
          value={`₹${formatCurrency(inventorySummary.total)}`}
          color="text-blue-400"
        />
        <InfoCard
          title="Raw Inventory Value"
          value={`₹${formatCurrency(inventorySummary.raw)}`}
          color="text-yellow-400"
        />
        <InfoCard
          title="Finished Inventory Value"
          value={`₹${formatCurrency(inventorySummary.finished)}`}
          color="text-green-400"
        />
        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
          <p className="text-sm opacity-70 mb-2">Low Stock (&lt; 250 pcs)</p>
          <div className="max-h-32 overflow-y-auto text-sm space-y-1">
            {inventory
              .filter((item) => item.quantity < 250)
              .map((item) => (
                <div key={item._id} className="flex justify-between">
                  <span>
                    {item.name} ({item.quantity})
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      item.type === "raw"
                        ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                        : "bg-green-500/20 text-green-500 border border-green-500/30"
                    }`}
                  >
                    {item.type.toUpperCase()}
                  </span>
                </div>
              ))}

            {!inventory.some((item) => item.quantity < 250) && (
              <div className="opacity-60">No Low Stock Items</div>
            )}
          </div>
        </div>
      </div>

      {/* 📊 INVENTORY BAR GRAPHS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* RAW MATERIAL GRAPH */}
        {(() => {
          const rawItems = inventory.filter(i => i.type === "raw");
          const maxRawQty = Math.max(
            ...rawItems.map(i => Number(i.quantity) || 0),
            1
          );

          return (
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Raw Materials</h3>

              {!rawItems.length ? (
                <div className="opacity-60 text-sm">No Raw Materials</div>
              ) : (
                <div className="flex h-64">
                  {/* Y AXIS */}
                  <div className="flex flex-col justify-between text-xs pr-3 opacity-60">
                    <span>400</span>
                    <span>300</span>
                    <span>200</span>
                    <span>100</span>
                    <span>0</span>
                  </div>
                  {/* GRAPH AREA */}
                  <div className="relative flex items-end gap-6 flex-1 overflow-x-auto border-l border-[var(--border)] pl-4">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                      <div className="border-t border-[var(--border)]" />
                      <div className="border-t border-[var(--border)]" />
                      <div className="border-t border-[var(--border)]" />
                      <div className="border-t border-[var(--border)]" />
                    </div>
                    {rawItems.map(item => {
                      const qty = Number(item.quantity) || 0;
                      const height = (qty / maxRawQty) * 100;

                      return (
                        <div key={item._id} className="flex flex-col justify-end items-center h-full" style={{ minWidth: "40px" }}>
                          <div
                            className="w-6 bg-yellow-500 rounded-t transition-all duration-300"
                            style={{
                              height: `${Math.max(height, 5)}%`,
                              minHeight: "6px"
                            }}
                          />
                          <p className="text-xs mt-2 text-center truncate w-full">
                            {item.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* FINISHED PRODUCT GRAPH */}
        {(() => {
          const finishedItems = inventory.filter(i => i.type === "finished");
          const maxFinishedQty = Math.max(
            ...finishedItems.map(i => Number(i.quantity) || 0),
            1
          );

          return (
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Finished Products</h3>

              {!finishedItems.length ? (
                <div className="opacity-60 text-sm">No Finished Products</div>
              ) : (
                <div className="flex h-64">
                  {/* Y AXIS */}
                  <div className="flex flex-col justify-between text-xs pr-3 opacity-60">
                    <span>400</span>
                    <span>300</span>
                    <span>200</span>
                    <span>100</span>
                    <span>0</span>
                  </div>
                  {/* GRAPH AREA */}
                  <div className="relative flex items-end gap-6 flex-1 overflow-x-auto border-l border-[var(--border)] pl-4">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                      <div className="border-t border-[var(--border)]" />
                      <div className="border-t border-[var(--border)]" />
                      <div className="border-t border-[var(--border)]" />
                      <div className="border-t border-[var(--border)]" />
                    </div>
                    {finishedItems.map(item => {
                      const qty = Number(item.quantity) || 0;
                      const height = (qty / maxFinishedQty) * 100;

                      return (
                        <div key={item._id} className="flex flex-col justify-end items-center h-full" style={{ minWidth: "40px" }}>
                          <div
                            className="w-6 bg-green-500 rounded-t transition-all duration-300"
                            style={{
                              height: `${Math.max(height, 5)}%`,
                              minHeight: "6px"
                            }}
                          />
                          <p className="text-xs mt-2 text-center truncate w-full">
                            {item.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* 🔥 LIVE PRODUCTION WIP SECTION */}
      <h2 className="text-2xl font-semibold mb-6">
        Live Production (WIP)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <InfoCard
          title="Active Batches"
          value={wipSummary.activeCount}
          color="text-blue-400"
        />
        <InfoCard
          title="Total Raw Cost"
          value={`₹${formatCurrency(wipSummary.totalRawCost)}`}
          color="text-red-400"
        />
        <InfoCard
          title="Total Output Planned"
          value={wipSummary.totalOutputQty}
          color="text-green-400"
        />
        <InfoCard
          title="Avg Cost / Unit"
          value={`₹${formatCurrency(wipSummary.avgCostPerUnit)}`}
          color="text-yellow-400"
        />
      </div>

      {/* WIP TABLE */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden mb-12">
        <table className="w-full text-sm">
          <thead className="bg-[var(--panel)] border-b border-[var(--border)]">
            <tr>
              <th className="p-3 text-left">Batch</th>
              <th className="p-3 text-left">Started</th>
              <th className="p-3 text-left">Raw Cost</th>
              <th className="p-3 text-left">Output Qty</th>
              <th className="p-3 text-left">Cost / Unit</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {wipBatches.map((b, i) => (
              <tr key={i} className="border-b border-[var(--border)]">
                <td className="p-3 font-medium">{b.batchNo}</td>
                <td className="p-3">
                  {new Date(b.startedAt).toLocaleDateString()}
                </td>
                <td className="p-3">
                  ₹{formatCurrency(b.totalRawCost)}
                </td>
                <td className="p-3">{b.totalOutputQty}</td>
                <td className="p-3">
                  ₹{formatCurrency(b.costPerUnit)}
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded bg-blue-600 text-xs">
                    In Progress
                  </span>
                </td>
              </tr>
            ))}
            {!wipBatches.length && (
              <tr>
                <td colSpan={6} className="p-4 text-center opacity-60">
                  No Active Production
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 💰 DAYBOOK OVERVIEW */}
      <h2 className="text-2xl font-semibold mb-6">
        Daybook Overview (Today)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <InfoCard
          title="Today's Income"
          value={`₹${formatCurrency(todaySummary.income)}`}
          color="text-green-400"
        />
        <InfoCard
          title="Today's Expense"
          value={`₹${formatCurrency(todaySummary.expense)}`}
          color="text-red-400"
        />
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
      <h3 className={`text-3xl mt-2 font-bold ${color}`}>
        {value}
      </h3>
    </div>
  );
}

function InfoCard({
  title,
  value,
  color,
}: {
  title: string;
  value: any;
  color: string;
}) {
  return (
    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
      <p className="text-sm opacity-70">{title}</p>
      <h3 className={`text-2xl mt-2 font-bold ${color}`}>
        {value}
      </h3>
    </div>
  );
}
