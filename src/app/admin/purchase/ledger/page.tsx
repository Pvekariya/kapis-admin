"use client";

import { useEffect, useMemo, useState } from "react";

export default function PurchaseLedger() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetch("/api/purchase/ledger")
      .then(res => res.json())
      .then(setData);
  }, []);

  const filtered = useMemo(() => {
    return data.filter((bill) => {
      const matchesSearch =
        bill.invoice?.toLowerCase().includes(search.toLowerCase()) ||
        bill.supplier?.toLowerCase().includes(search.toLowerCase()) ||
        bill.product?.toLowerCase().includes(search.toLowerCase());

      const billDate = new Date(bill.date);
      const matchesFrom = fromDate
        ? billDate >= new Date(fromDate)
        : true;
      const matchesTo = toDate
        ? billDate <= new Date(toDate)
        : true;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [data, search, fromDate, toDate]);

  const formatCurrency = (val: number) =>
    Math.round(val || 0).toLocaleString("en-IN");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Purchase Ledger</h2>

      {/* Search & Filters */}
      <div className="grid md:grid-cols-4 gap-3 bg-[var(--panel)] p-4 rounded-xl border border-[var(--border)]">
        <input
          placeholder="Search Invoice / Vendor / Product"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="input"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="input"
        />

        <button
          onClick={() => {
            setSearch("");
            setFromDate("");
            setToDate("");
          }}
          className="btn border"
        >
          Reset
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/20">
            <tr>
              <th className="p-3 text-left">Invoice</th>
              <th className="p-3 text-left">Vendor</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Qty</th>
              <th className="p-3 text-left">Price / pcs</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Paid By</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((bill) => (
              <tr key={bill._id} className="border-b border-[var(--border)]">
                <td className="p-3 font-medium">{bill.invoice}</td>
                <td className="p-3">{bill.supplier}</td>
                <td className="p-3">
                  {bill.items && bill.items.length > 0
                    ? bill.items.map((i: any) => i.name).join(", ")
                    : bill.product || "-"}
                </td>
                <td className="p-3">
                  {bill.items && bill.items.length > 0
                    ? bill.items.map((i: any) => i.qty).join(", ")
                    : bill.quantity || "-"}
                </td>
                <td className="p-3">
                  {bill.items && bill.items.length > 0
                    ? "Multiple"
                    : `₹${formatCurrency(bill.pricePerUnit)}`}
                </td>
                <td className="p-3">
                  ₹{formatCurrency(bill.total)}
                </td>
                <td className="p-3 capitalize">{bill.paymentMode}</td>
                <td className="p-3">
                  {new Date(bill.date).toLocaleDateString()}
                </td>
              </tr>
            ))}

            {!filtered.length && (
              <tr>
                <td colSpan={8} className="p-4 text-center opacity-60">
                  No Purchase Records Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}