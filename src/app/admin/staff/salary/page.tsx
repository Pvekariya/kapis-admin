"use client";

import { useEffect, useState } from "react";

export default function SalaryPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [advanceState, setAdvanceState] = useState<
    Record<string, { amount: string; reason: string; paymentMode: string }>
  >({});

  const [salaryPaymentMode, setSalaryPaymentMode] = useState<
    Record<string, string>
  >({});

  const [advances, setAdvances] = useState<Record<string, any[]>>({});

  useEffect(() => {
    fetchSalary();
  }, [month, year]);

  const fetchSalary = async () => {
    const res = await fetch(`/api/staff/salary?month=${month}&year=${year}`);
    if (!res.ok) return;

    const result = await res.json();
    if (!Array.isArray(result)) return;

    setData(result);

    const advRes = await fetch(`/api/staff/advances?month=${month}&year=${year}`);
    if (advRes.ok) {
      const advData = await advRes.json();
      const grouped: Record<string, any[]> = {};
      advData.forEach((a: any) => {
        if (!grouped[a.staffId]) grouped[a.staffId] = [];
        grouped[a.staffId].push(a);
      });
      setAdvances(grouped);
    }
  };

  const lockMonth = async (staffId: string) => {
    await fetch("/api/staff/salary", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, month, year }),
    });
    fetchSalary();
  };

  const markPaid = async (s: any) => {
    if (!s.remaining || s.remaining <= 0) return;

    await fetch("/api/staff/salary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId: s.staffId,
        month,
        year,
        amount: s.remaining,
        paymentMode: salaryPaymentMode[s.staffId] || "Cash",
      }),
    });

    fetchSalary();
  };

  const handleAdvanceChange = (
    staffId: string,
    field: "amount" | "reason" | "paymentMode",
    value: string
  ) => {
    setAdvanceState((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: value,
      },
    }));
  };

  const addAdvance = async (staffId: string) => {
    const entry = advanceState[staffId];
    if (!entry?.amount) return;

    await fetch("/api/staff/advances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId,
        amount: Number(entry.amount),
        reason: entry.reason || "",
        paymentMode: entry.paymentMode || "Cash",
        month,
        year,
      }),
    });

    setAdvanceState((prev) => ({
      ...prev,
      [staffId]: { amount: "", reason: "", paymentMode: "" },
    }));

    fetchSalary();
  };

  const deleteAdvance = async (id: string) => {
    await fetch("/api/staff/advances", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchSalary();
  };

  const totalEarned = data.reduce((sum, s) => sum + (s.earned || 0), 0);
  const totalAdvance = data.reduce((sum, s) => sum + (s.totalAdvance || 0), 0);
  const totalRemaining = data.reduce((sum, s) => sum + (s.remaining || 0), 0);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Salary Management</h1>

      <div className="flex gap-4 mb-6">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="bg-[#111827] border border-gray-700 p-2 rounded"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-[#111827] border border-gray-700 p-2 rounded"
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card title="Total Earned" value={totalEarned} />
        <Card title="Total Advance" value={totalAdvance} />
        <Card title="Net Payable" value={totalRemaining} />
        <Card title="Active Staff" value={data.length} />
      </div>

      <div className="space-y-4">
        {data.map((s) => (
          <div
            key={s.staffId}
            className="bg-[#0f172a] border border-gray-700 rounded-xl p-5"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">{s.name}</h2>
                <p className="text-sm text-gray-400">
                  Monthly Salary: ₹{s.monthlySalary}
                </p>
              </div>

              <div className="text-right">
                <p className="text-green-400">Earned: ₹{Math.round(s.earned)}</p>
                <p className="text-yellow-400">Advance: ₹{s.totalAdvance}</p>
                <p className="text-blue-400 font-bold">
                  Remaining: ₹{Math.round(s.remaining)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              {!s.isLocked && (
                <button
                  onClick={() => lockMonth(s.staffId)}
                  className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded"
                >
                  Lock Month
                </button>
              )}

              {s.isLocked && !s.isPaid && (
                <>
                  <select
                    value={salaryPaymentMode[s.staffId] || "Cash"}
                    onChange={(e) =>
                      setSalaryPaymentMode((prev) => ({
                        ...prev,
                        [s.staffId]: e.target.value,
                      }))
                    }
                    className="bg-[#111827] border border-gray-600 p-2 rounded"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank</option>
                  </select>

                  <button
                    onClick={() => markPaid(s)}
                    className="bg-green-600 px-4 py-2 rounded"
                  >
                    Mark Salary Paid
                  </button>
                </>
              )}

              {s.isPaid && (
                <span className="text-green-400 font-semibold">
                  Salary Paid ✓
                </span>
              )}
            </div>

            {/* Advance Section */}
            <div className="mt-6 border-t border-gray-700 pt-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-300">
                Advance Payment
              </h3>

              <div className="flex gap-3 mb-3">
                <input
                  type="number"
                  placeholder="Amount"
                  value={advanceState[s.staffId]?.amount || ""}
                  onChange={(e) =>
                    handleAdvanceChange(
                      s.staffId,
                      "amount",
                      e.target.value
                    )
                  }
                  className="bg-[#111827] border border-gray-600 p-2 rounded w-32"
                />

                <input
                  type="text"
                  placeholder="Reason"
                  value={advanceState[s.staffId]?.reason || ""}
                  onChange={(e) =>
                    handleAdvanceChange(
                      s.staffId,
                      "reason",
                      e.target.value
                    )
                  }
                  className="bg-[#111827] border border-gray-600 p-2 rounded"
                />

                <select
                  value={advanceState[s.staffId]?.paymentMode || "Cash"}
                  onChange={(e) =>
                    handleAdvanceChange(
                      s.staffId,
                      "paymentMode",
                      e.target.value
                    )
                  }
                  className="bg-[#111827] border border-gray-600 p-2 rounded"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank">Bank</option>
                </select>

                <button
                  onClick={() => addAdvance(s.staffId)}
                  className="bg-yellow-600 px-4 py-2 rounded"
                >
                  Pay Advance
                </button>
              </div>

              {advances[s.staffId]?.length > 0 && (
                <div className="space-y-2">
                  {advances[s.staffId].map((a: any) => (
                    <div
                      key={a._id}
                      className="flex justify-between items-center bg-[#111827] p-2 rounded"
                    >
                      <div>
                        <p className="text-sm">₹{a.amount}</p>
                        <p className="text-xs text-gray-400">
                          {a.reason || "No reason"}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteAdvance(a._id)}
                        className="text-red-400 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="bg-[#0f172a] border border-gray-700 rounded-xl p-5">
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <h2 className="text-2xl font-bold">₹{Math.round(value || 0)}</h2>
    </div>
  );
}