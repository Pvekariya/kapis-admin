"use client";

import { useEffect, useState } from "react";
import { useMemo } from "react";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(null);

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetch("/api/sales")
      .then(res => res.json())
      .then(setSales);
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter(bill => {
      const d = new Date(bill.date);

      if (month && d.getMonth() + 1 !== Number(month)) return false;
      if (year && d.getFullYear() !== Number(year)) return false;

      if (
        search &&
        !bill.customer?.toLowerCase().includes(search.toLowerCase())
      )
        return false;

      if (fromDate && new Date(bill.date) < new Date(fromDate))
        return false;

      if (toDate && new Date(bill.date) > new Date(toDate))
        return false;

      return true;
    });
  }, [sales, month, year, search, fromDate, toDate]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">
        Sales Ledger
      </h2>

      <div className="grid md:grid-cols-6 gap-3 bg-[var(--panel)] p-4 rounded-xl border border-[var(--border)] mb-4">
        <input
          placeholder="Search Invoice / Customer"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
        />

        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="input"
        >
          <option value="">Month</option>
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>

        <input
          placeholder="Year"
          value={year}
          onChange={e => setYear(e.target.value)}
          className="input"
        />

        <input
          type="date"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          className="input"
        />

        <input
          type="date"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          className="input"
        />

        <button
          onClick={() => {
            if (!filteredSales.length) {
              alert("No entries to export");
              return;
            }
            window.print();
          }}
          className="btn border"
        >
          Export
        </button>
      </div>

      <div className="ledger-print bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden print:bg-white print:text-black print:border-black print:rounded-none">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="p-3">Invoice</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredSales.map(bill => (
              <tr
                key={bill._id}
                className="border-b border-[var(--border)] hover:bg-white/5 cursor-pointer"
                onClick={() => setSelected(bill)}
              >
                <td className="p-3 text-blue-500 underline">
                  {bill.invoice}
                </td>
                <td className="p-3">{bill.customer}</td>
                <td className="p-3">₹{bill.total}</td>
                <td className="p-3">
                  {new Date(bill.date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BILL DETAILS POPUP */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded-xl w-[500px]">
            <h3 className="text-lg font-bold mb-2">
              Invoice {selected.invoice}
            </h3>

            <p>Customer: {selected.customer}</p>
            <p>Address: {selected.address}</p>

            <table className="w-full mt-4 border text-sm">
              <thead>
                <tr>
                  <th className="border p-2">Product</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Price</th>
                  <th className="border p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((i: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border p-2">{i.name}</td>
                    <td className="border p-2">{i.qty}</td>
                    <td className="border p-2">₹{i.price}</td>
                    <td className="border p-2">₹{i.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 text-sm">
              Debit: ₹{selected.total}
              <br />
              Credit: ₹{selected.paid || 0}
              <br />
              Balance: ₹{selected.total - (selected.paid || 0)}
            </div>

            <p className="mt-4 font-bold">
              Total: ₹{selected.total}
            </p>

            <button
              onClick={() => {
                setEditing(selected);
                setForm(JSON.parse(JSON.stringify(selected)));
              }}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full"
            >
              Update Entry
            </button>

            <button
              onClick={() => setSelected(null)}
              className="mt-4 btn w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {editing && form && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-xl w-[520px] space-y-4">

            <h3 className="text-lg font-bold">
              Update Invoice {form.invoice}
            </h3>

            <input
              type="date"
              value={form.date?.slice(0,10)}
              onChange={e => setForm({...form, date: e.target.value})}
              className="w-full border p-2 rounded"
            />

            {form.items.map((item: any, idx: number) => (
              <div key={idx} className="border p-3 rounded space-y-2">
                <input
                  value={item.name}
                  onChange={e => {
                    const copy = [...form.items];
                    copy[idx].name = e.target.value;
                    setForm({...form, items: copy});
                  }}
                  placeholder="Item"
                  className="w-full border p-2 rounded"
                />

                <input
                  type="number"
                  value={item.qty}
                  onChange={e => {
                    const copy = [...form.items];
                    copy[idx].qty = Number(e.target.value);
                    copy[idx].total = copy[idx].qty * copy[idx].price;
                    setForm({...form, items: copy});
                  }}
                  placeholder="Quantity"
                  className="w-full border p-2 rounded"
                />
              </div>
            ))}

            <input
              type="number"
              value={form.paid || 0}
              onChange={e => setForm({ ...form, paid: Number(e.target.value) })}
              placeholder="Paid amount"
              className="w-full border p-2 rounded"
            />

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const res = await fetch("/api/sales/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: editing._id,
                      update: form,
                    }),
                  });

                  const text = await res.text();
                  if (!text) {
                    alert("Empty response from server");
                    return;
                  }
                  const data = JSON.parse(text);

                  if (data.success) {
                    alert("Updated successfully");
                    setEditing(null);
                    setSelected(null);

                    fetch("/api/sales")
                      .then(res => res.json())
                      .then(setSales);
                  } else {
                    alert("Update failed");
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded flex-1"
              >
                Save
              </button>

              <button
                onClick={() => setEditing(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}