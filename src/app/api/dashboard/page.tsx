"use client";

import { useEffect, useState } from "react";

export default function SmartDashboard() {
  const [data, setData] = useState<any>(null);
  const [modal, setModal] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/insights")
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="space-y-8">

      <h2 className="text-2xl font-semibold">
        Smart Inventory Insights
      </h2>

      <div className="grid grid-cols-4 gap-6">

        <Card
          title="Low Stock"
          value={data.lowStockCount}
          onClick={() => setModal(data.lowStockItems)}
        />

        <Card
          title="Dead Stock"
          value={data.deadStockCount}
          onClick={() => setModal(data.deadStockItems)}
        />

        <Card
          title="New Leads Today"
          value={data.newLeadsToday}
          onClick={() => setModal(data.todayLeads)}
        />

        <Card
          title="Pending Orders"
          value={data.pendingOrders}
          onClick={() => setModal(data.orders)}
        />

      </div>

      {modal && (
        <Modal data={modal} close={() => setModal(null)} />
      )}
    </div>
  );
}

function Card({ title, value, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-[var(--panel)] border border-[var(--border)]
      rounded-xl p-6 hover:scale-105 transition hover:shadow-xl"
    >
      <p className="opacity-70">{title}</p>
      <h3 className="text-3xl font-bold mt-2">{value}</h3>
    </div>
  );
}

function Modal({ data, close }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

      <div className="bg-[var(--panel)] p-6 rounded-xl w-[600px] max-h-[70vh] overflow-y-auto">

        <button onClick={close} className="mb-4 text-sm opacity-60">
          Close
        </button>

        {data.map((d: any, i: number) => (
          <pre key={i} className="text-xs border-b py-2">
            {JSON.stringify(d, null, 2)}
          </pre>
        ))}

      </div>

    </div>
  );
}