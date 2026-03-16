"use client";

import { useEffect, useState } from "react";
import Analytics from "./analytics";

const fmt = (v: number) => Math.round(v || 0).toLocaleString("en-IN");

type InventoryItem = {
  _id: string; name: string; quantity: number;
  price?: number; costPrice?: number; type: "raw" | "finished";
};

/* ── Reusable stat card ─────────────────────────────────────── */
function StatCard({
  label, value, color, sub,
}: {
  label: string; value: string | number;
  color: "green" | "red" | "blue" | "amber" | "purple"; sub?: string;
}) {
  return (
    <div className={`stat-card sc-${color}`}>
      <div className="sc-border" />
      <div className="sc-glow" />
      <p className="sc-label">{label}</p>
      <p className="sc-value">{value}</p>
      {sub && <p className="sc-sub">{sub}</p>}
    </div>
  );
}

/* ── Bar chart ──────────────────────────────────────────────── */
function MiniBarChart({
  items, color, title,
}: {
  items: InventoryItem[]; color: string; title: string;
}) {
  const max = Math.max(...items.map((i) => Number(i.quantity) || 0), 1);
  return (
    <div className="g-card" style={{ padding: "20px 22px" }}>
      <p className="section-label" style={{ marginBottom: 16 }}>{title}</p>
      {items.length === 0 ? (
        <p style={{ color: "var(--text-3)", fontSize: 13, padding: "24px 0" }}>No items</p>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140, overflowX: "auto", paddingBottom: 4 }}>
          {items.map((item) => {
            const h = Math.max((Number(item.quantity) / max) * 120, 3);
            return (
              <div key={item._id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 36, flex: "0 0 auto" }}>
                <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'DM Mono',monospace" }}>
                  {item.quantity}
                </span>
                <div style={{
                  width: 24, height: h,
                  background: `var(--${color})`,
                  borderRadius: "4px 4px 0 0",
                  opacity: 0.8,
                  boxShadow: `0 0 12px var(--${color}-dim, rgba(0,0,0,0))`,
                  transition: "height 0.4s ease",
                }} />
                <span style={{
                  fontSize: 10, color: "var(--text-3)",
                  maxWidth: 40, textAlign: "center",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Loader ─────────────────────────────────────────────────── */
function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <div className="spinner" />
    </div>
  );
}

/* ── Section heading ────────────────────────────────────────── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
        {children}
      </h2>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────── */
export default function Dashboard() {
  const [wip, setWip] = useState<any>({ batches: [], summary: {} });
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invSummary, setInvSummary] = useState({ total: 0, raw: 0, finished: 0 });
  const [today, setToday] = useState({ income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const o = { credentials: "include" as RequestCredentials };
    const d = new Date().toISOString().slice(0, 10);

    Promise.all([
      fetch("/api/production/wip", o).then(r => r.json()).catch(() => ({})),
      fetch("/api/inventory", o).then(r => r.json()).catch(() => []),
      fetch(`/api/daybook?from=${d}&to=${d}`, o).then(r => r.json()).catch(() => ({})),
    ]).then(([wipData, inv, db]) => {
      setWip({ batches: wipData?.batches ?? [], summary: wipData?.summary ?? {} });

      const items = Array.isArray(inv) ? inv : [];
      setInventory(items);

      let total = 0, raw = 0, finished = 0;
      items.forEach((i: any) => {
        const v = (Number(i.quantity) || 0) * (Number(i.costPrice) || Number(i.price) || 0);
        total += v;
        if (i.type === "raw") raw += v; else finished += v;
      });
      setInvSummary({ total, raw, finished });
      setToday({ income: db?.summary?.totalIncome ?? 0, expense: db?.summary?.totalExpense ?? 0 });
      setLoading(false);
    });
  }, []);

  if (loading) return <Loader />;

  const rawItems = inventory.filter(i => i.type === "raw");
  const finishedItems = inventory.filter(i => i.type === "finished");
  const lowItems = inventory.filter(i => i.quantity < 250);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Inventory ──────────────────────────────────────── */}
      <section>
        <SectionHeading>Inventory Overview</SectionHeading>
        <div className="grid-stats stagger" style={{ marginBottom: 16 }}>
          <StatCard label="Total Value"       value={`₹${fmt(invSummary.total)}`}    color="blue"   />
          <StatCard label="Raw Materials"     value={`₹${fmt(invSummary.raw)}`}      color="amber"  />
          <StatCard label="Finished Products" value={`₹${fmt(invSummary.finished)}`} color="green"  />
          <div className="stat-card sc-red">
            <div className="sc-border" />
            <div className="sc-glow" />
            <p className="sc-label">Low Stock &lt; 250</p>
            <p className="sc-value">{lowItems.length}</p>
            {lowItems.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4, maxHeight: 72, overflowY: "auto" }}>
                {lowItems.map(i => (
                  <div key={i._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>{i.name}</span>
                    <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "var(--red)", marginLeft: 6 }}>{i.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid-2">
          <MiniBarChart items={rawItems}      color="amber" title="Raw Materials" />
          <MiniBarChart items={finishedItems} color="green" title="Finished Products" />
        </div>
      </section>

      {/* ── WIP Production ─────────────────────────────────── */}
      <section>
        <SectionHeading>Live Production</SectionHeading>
        <div className="grid-stats stagger" style={{ marginBottom: 16 }}>
          <StatCard label="Active Batches"  value={wip.summary.activeCount ?? 0}              color="blue"   />
          <StatCard label="Total Raw Cost"  value={`₹${fmt(wip.summary.totalRawCost ?? 0)}`}  color="red"    />
          <StatCard label="Output Planned"  value={wip.summary.totalOutputQty ?? 0}            color="green"  />
          <StatCard label="Avg Cost / Unit" value={`₹${fmt(wip.summary.avgCostPerUnit ?? 0)}`} color="amber"  />
        </div>

        <div className="g-table">
          <table>
            <thead>
              <tr>
                <th>Batch</th><th>Started</th><th>Raw Cost</th>
                <th>Output Qty</th><th>Cost / Unit</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {wip.batches.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "28px 0", color: "var(--text-3)" }}>No active production batches</td></tr>
              ) : wip.batches.map((b: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{b.batchNo}</td>
                  <td className="t-small">{new Date(b.startedAt).toLocaleDateString()}</td>
                  <td>₹{fmt(b.totalRawCost)}</td>
                  <td>{b.totalOutputQty}</td>
                  <td>₹{fmt(b.costPerUnit)}</td>
                  <td><span className="badge badge-blue">In Progress</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Today's Daybook ────────────────────────────────── */}
      <section>
        <SectionHeading>Today</SectionHeading>
        <div className="grid-2">
          <StatCard label="Today's Income"  value={`₹${fmt(today.income)}`}  color="green" />
          <StatCard label="Today's Expense" value={`₹${fmt(today.expense)}`} color="red"   />
        </div>
      </section>

      {/* ── Analytics ──────────────────────────────────────── */}
      <section>
        <SectionHeading>Analytics</SectionHeading>
        <Analytics />
      </section>

    </div>
  );
}