"use client";

import { useEffect, useState } from "react";

export default function PurchaseLedger() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/purchase/ledger")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">
        Purchase Ledger
      </h2>

      <table className="w-full border text-sm">
        <thead>
          <tr>
            <th className="border p-2">Invoice</th>
            <th className="border p-2">Supplier</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Date</th>
          </tr>
        </thead>

        <tbody>
          {data.map(bill => (
            <tr key={bill._id}>
              <td className="border p-2">{bill.invoice}</td>
              <td className="border p-2">{bill.supplier}</td>
              <td className="border p-2">₹{bill.total}</td>
              <td className="border p-2">
                {new Date(bill.date).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}