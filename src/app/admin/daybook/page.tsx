"use client";

import { useEffect, useState } from "react";

const paymentModes = [
  { value: "", label: "All" },
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank" },
];

const types = [
  { value: "", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

export default function DaybookPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    cashBalance: 0,
    bankBalance: 0,
  });
  const [form, setForm] = useState({
    type: "expense",
    category: "misc",
    description: "",
    amount: "",
    paymentMode: "cash",
    date: "",
  });
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    type: "",
    paymentMode: "",
  });
  const [quickRange, setQuickRange] = useState<"today" | "month" | "fy" | "all">("all");
  const [selectedFY, setSelectedFY] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const formatCurrency = (value: number) => {
    return Math.round(value || 0).toLocaleString("en-IN");
  };

  const getFinancialYearRange = (year: number) => {
    const start = `${year}-04-01`;
    const end = `${year + 1}-03-31`;
    return { start, end };
  };

  const getCurrentFYStartYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return month <= 3 ? year - 1 : year;
  };

  const getFYLabel = (year: number) => {
    return `FY ${year}-${String(year + 1).slice(-2)}`;
  };

  const applyQuickFilter = (type: "today" | "month" | "fy" | "all") => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    setQuickRange(type);

    if (type === "today") {
      const dateStr = `${yyyy}-${mm}-${dd}`;
      setFilters({
        from: dateStr,
        to: dateStr,
        type: "",
        paymentMode: "",
      });
    }

    if (type === "month") {
      const first = `${yyyy}-${mm}-01`;
      const lastDate = new Date(yyyy, today.getMonth() + 1, 0).getDate();
      const last = `${yyyy}-${mm}-${String(lastDate).padStart(2, "0")}`;

      setFilters({
        from: first,
        to: last,
        type: "",
        paymentMode: "",
      });
    }

    if (type === "fy") {
      const fyYear = selectedFY ?? getCurrentFYStartYear();
      const { start, end } = getFinancialYearRange(fyYear);

      setFilters({
        from: start,
        to: end,
        type: "",
        paymentMode: "",
      });
    }

    if (type === "all") {
      setFilters({
        from: "",
        to: "",
        type: "",
        paymentMode: "",
      });
    }
  };

  // Build query params from filters
  function buildQueryParams(obj: Record<string, string>) {
    const params = Object.entries(obj)
      .filter(([k, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    return params.length > 0 ? "?" + params.join("&") : "";
  }

  const load = async () => {
    const params = buildQueryParams(filters);
    const res = await fetch("/api/daybook" + params);
    const data = await res.json();
    setEntries(data.entries || []);
    setSummary(data.summary || {});
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const addEntry = async () => {
    if (isSaving) return;

    const newErrors: any = {};

    if (!form.type) newErrors.type = true;
    if (!form.category) newErrors.category = true;
    if (!form.date) newErrors.date = true;
    if (!form.description || form.description.trim().length < 2) newErrors.description = true;
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      newErrors.amount = true;
    if (!form.paymentMode) newErrors.paymentMode = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setIsSaving(true);

    try {
      await fetch("/api/daybook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });

      setForm({
        type: "expense",
        category: "misc",
        description: "",
        amount: "",
        paymentMode: "cash",
        date: "",
      });

      setErrors({});
      await load();
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: any, nextId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = document.getElementById(nextId);
      if (next) next.focus();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Daybook</h2>

      {/* Quick Range Toggle */}
      <div className="flex gap-3">
        <button
          onClick={() => applyQuickFilter("today")}
          className={`px-4 py-2 rounded-lg border ${
            quickRange === "today"
              ? "bg-blue-600 text-white"
              : "bg-[var(--panel)]"
          }`}
        >
          Today
        </button>

        <button
          onClick={() => applyQuickFilter("month")}
          className={`px-4 py-2 rounded-lg border ${
            quickRange === "month"
              ? "bg-blue-600 text-white"
              : "bg-[var(--panel)]"
          }`}
        >
          This Month
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => applyQuickFilter("fy")}
            className={`px-4 py-2 rounded-lg border ${
              quickRange === "fy"
                ? "bg-blue-600 text-white"
                : "bg-[var(--panel)]"
            }`}
          >
            {selectedFY
              ? getFYLabel(selectedFY)
              : getFYLabel(getCurrentFYStartYear())}
          </button>

          <select
            value={selectedFY ?? getCurrentFYStartYear()}
            onChange={(e) => {
              const year = Number(e.target.value);
              setSelectedFY(year);
              if (quickRange === "fy") {
                const { start, end } = getFinancialYearRange(year);
                setFilters({
                  from: start,
                  to: end,
                  type: "",
                  paymentMode: "",
                });
              }
            }}
            className="input w-36"
          >
            {Array.from({ length: 6 }).map((_, i) => {
              const current = getCurrentFYStartYear();
              const year = current - i;
              return (
                <option key={year} value={year}>
                  {getFYLabel(year)}
                </option>
              );
            })}
          </select>
        </div>

        <button
          onClick={() => applyQuickFilter("all")}
          className={`px-4 py-2 rounded-lg border ${
            quickRange === "all"
              ? "bg-blue-600 text-white"
              : "bg-[var(--panel)]"
          }`}
        >
          All Time
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-[var(--panel)] p-4 rounded-xl border border-[var(--border)]">
        <div>
          <label className="block text-xs mb-1">From</label>
          <input
            type="date"
            value={filters.from}
            onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">To</label>
          <input
            type="date"
            value={filters.to}
            onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Type</label>
          <select
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            className="input"
          >
            {types.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Payment</label>
          <select
            value={filters.paymentMode}
            onChange={e => setFilters(f => ({ ...f, paymentMode: e.target.value }))}
            className="input"
          >
            {paymentModes.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={load}
          className="btn border ml-auto"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-green-600/20 p-4 rounded-xl">
          <div className="text-xs">Income</div>
          <div className="text-lg font-bold">₹{formatCurrency(summary.totalIncome)}</div>
        </div>
        <div className="bg-red-600/20 p-4 rounded-xl">
          <div className="text-xs">Expense</div>
          <div className="text-lg font-bold">₹{formatCurrency(summary.totalExpense)}</div>
        </div>
        <div className="bg-yellow-600/20 p-4 rounded-xl">
          <div className="text-xs">Net</div>
          <div className="text-lg font-bold">₹{formatCurrency(summary.netBalance)}</div>
        </div>
        <div className="bg-blue-600/20 p-4 rounded-xl">
          <div className="text-xs">Cash</div>
          <div className="text-lg font-bold">₹{formatCurrency(summary.cashBalance)}</div>
        </div>
        <div className="bg-purple-600/20 p-4 rounded-xl">
          <div className="text-xs">Bank</div>
          <div className="text-lg font-bold">₹{formatCurrency(summary.bankBalance)}</div>
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-[var(--panel)] p-4 rounded-xl border border-[var(--border)] grid grid-cols-3 gap-3">
        <select
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}
          className={`input ${errors.type ? "border-red-500" : ""}`}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          className={`input ${errors.category ? "border-red-500" : ""}`}
        >
          <option value="sale">Sale</option>
          <option value="purchase">Purchase</option>
          <option value="salary">Salary</option>
          <option value="advance">Advance</option>
          <option value="misc">Misc</option>
        </select>
        <input
          type="date"
          id="date"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
          onKeyDown={(e) => handleKeyDown(e, "description")}
          className={`input ${errors.date ? "border-red-500" : ""}`}
        />
        <input
          id="description"
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          onKeyDown={(e) => handleKeyDown(e, "amount")}
          className={`input col-span-2 ${errors.description ? "border-red-500" : ""}`}
        />
        <input
          id="amount"
          placeholder="Amount"
          type="number"
          min="1"
          step="1"
          value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })}
          onKeyDown={(e) => handleKeyDown(e, "paymentMode")}
          className={`input ${errors.amount ? "border-red-500" : ""}`}
        />
        <select
          id="paymentMode"
          value={form.paymentMode}
          onChange={e => setForm({ ...form, paymentMode: e.target.value })}
          onKeyDown={(e) => handleKeyDown(e, "addButton")}
          className={`input ${errors.paymentMode ? "border-red-500" : ""}`}
        >
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="bank">Bank</option>
        </select>
        <button
          type="button"
          id="addButton"
          onClick={addEntry}
          disabled={isSaving}
          className={`btn bg-blue-600 ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isSaving ? "Saving..." : "Add Entry"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-[var(--panel)] rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)]">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Type</th>
              <th className="p-3">Category</th>
              <th className="p-3">Description</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e._id} className="border-b border-[var(--border)]">
                <td className="p-3">
                  {e.date ? new Date(e.date).toLocaleDateString() : ""}
                </td>
                <td className="p-3">{e.type}</td>
                <td className="p-3">{e.category}</td>
                <td className="p-3">{e.description || "-"}</td>
                <td className="p-3">{e.paymentMode}</td>
                <td className="p-3 font-semibold">
                  ₹{formatCurrency(Number(e.amount) || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}