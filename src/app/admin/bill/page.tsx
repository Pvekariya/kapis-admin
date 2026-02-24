"use client";

import { useEffect, useState } from "react";

type Item = {
  productId: string;
  label: string;
  qty: number | "";
  price: number | "";
};

export default function BillPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [invoice, setInvoice] = useState("");
  const [note, setNote] = useState("");
  const [today, setToday] = useState("");

  const [paid, setPaid] = useState("");
  const [paidDate, setPaidDate] = useState("");

  const [cgst, setCgst] = useState("");
  const [sgst, setSgst] = useState("");
  const [igst, setIgst] = useState("");

  const [items, setItems] = useState<Item[]>([
    { productId: "", label: "", qty: "", price: "" },
  ]);

  useEffect(() => {
    fetch("/api/inventory").then(r => r.json()).then(setInventory);
    fetch("/api/sales/next")
      .then(r => r.json())
      .then(d => setInvoice(d.invoice || "001"));
    setToday(new Date().toLocaleDateString("en-IN"));
  }, []);

  const addRow = () =>
    setItems(prev => [
      ...prev,
      { productId: "", label: "", qty: "", price: "" },
    ]);

  const update = (i: number, key: keyof Item, val: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [key]: val };
      return copy;
    });
  };

  const selectProduct = (i: number, id: string) => {
    const p = inventory.find(x => x._id === id);
    if (!p) return;

    const label = `${p.name} | ${p.color} | ${p.type} | ${p.packing}`;

    setItems(prev => {
      const copy = [...prev];
      copy[i] = {
        ...copy[i],
        productId: id,
        label,
        price: p.price,
      };
      return copy;
    });
  };

  const subtotal = items.reduce(
    (t, i) => t + Number(i.qty || 0) * Number(i.price || 0),
    0
  );

  const gst = subtotal * ((+cgst + +sgst + +igst) / 100);
  const total = subtotal + gst;

  const paidAmount = Number(paid || 0);
  const due = total - paidAmount;

  const printInvoice = async () => {
  try {
    // 1️⃣ save bill first
    const res = await fetch("/api/inventory/deduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice,
        customer,
        address,
        note,
        subtotal,
        gst,
        total,
        paid: paidAmount,
        paidDate,
        due,
        items,
      }),
    });

    if (!res.ok) {
      alert("Failed to save bill");
      return;
    }

    // 2️⃣ print AFTER save
    window.print();

    alert("Bill saved + printed successfully");

  } catch (err) {
    console.error(err);
    alert("Server error while saving bill");
  }
};

  const rows = [...items];
  while (rows.length < 12)
    rows.push({ productId: "", label: "", qty: "", price: "" });

  return (
    <div className="flex gap-10">

      {/* LEFT PANEL */}
      <div className="w-96 space-y-4 print:hidden">

        <input
          placeholder="Customer"
          value={customer}
          onChange={e => setCustomer(e.target.value)}
          className="input"
        />

        <textarea
          placeholder="Address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          className="input h-20"
        />
        <textarea
          placeholder="NOTE"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="input h-16"
        />

        <input value={invoice} readOnly className="input bg-gray-800" />

        <div className="grid grid-cols-3 gap-2">
          <input placeholder="CGST %" value={cgst}
            onChange={e => setCgst(e.target.value)} className="input" />
          <input placeholder="SGST %" value={sgst}
            onChange={e => setSgst(e.target.value)} className="input" />
          <input placeholder="IGST %" value={igst}
            onChange={e => setIgst(e.target.value)} className="input" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Paid Amount"
            value={paid}
            onChange={e => setPaid(e.target.value)}
            className="input"
          />
          <input
            type="date"
            value={paidDate}
            onChange={e => setPaidDate(e.target.value)}
            className="input"
          />
        </div>

        <div className="border border-zinc-700 p-3 rounded-lg space-y-3">
          {items.map((i, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2">

              <select
                value={i.productId}
                onChange={e => selectProduct(idx, e.target.value)}
                className="input"
              >
                <option value="">Select product</option>
                {inventory.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>

              <input type="number" placeholder="Qty" value={i.qty}
                onChange={e =>
                  update(idx, "qty", e.target.value === "" ? "" : +e.target.value)}
                className="input"
              />

              <input type="number" placeholder="Price" value={i.price}
                onChange={e =>
                  update(idx, "price", e.target.value === "" ? "" : +e.target.value)}
                className="input"
              />
            </div>
          ))}

          <button onClick={addRow} className="btn w-full">
            + Add Row
          </button>
        </div>

        <button onClick={printInvoice}
          className="btn w-full bg-green-600">
          Print Invoice
        </button>
      </div>

      {/* BILL */}
      <div className="invoice">

        <h1 className="title">KAPIS LIGHTS</h1>

        <div className="box text-xs">
          <div>
            Customer: {customer}<br />
            Address: {address}
          </div>
          <div>
            Date: {today}<br />
            Invoice: {invoice}
          </div>
        </div>

        {/* TABLE AREA */}
        <div className="table-area">
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>Sr</th>
                <th style={{ width: "42%" }}>Product</th>
                <th style={{ width: "15%" }}>Qty</th>
                <th style={{ width: "15%" }}>Price</th>
                <th style={{ width: "20%" }}>Sub Total</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((i, idx) => (
                <tr key={idx}>
                  <td>{i.label ? idx + 1 : ""}</td>
                  <td>{i.label}</td>
                  <td>{i.qty}</td>
                  <td>{i.price && `₹${i.price}`}</td>
                  <td>
                    {i.qty && i.price &&
                      `₹${Number(i.qty) * Number(i.price)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* NOTE */}
        <div className="mt-3 border-t border-black pt-2 text-sm">
          <b>NOTE:</b> {note || "-"}
        </div>

        {/* FOOTER */}
        <div className="footer">
          <div className="total">
            Subtotal: ₹{subtotal}<br />
            GST: ₹{gst}<br />
            Paid: ₹{paidAmount} {paidDate && `( ${new Date(paidDate).toLocaleDateString("en-GB")} )`}<br />
            Due: ₹{due}<br />
            <b>Total: ₹{total}</b>
          </div>

          <div className="sign">
            Company Signature<br />
            Kapis Lights
          </div>
        </div>

      </div>
    </div>
  );
}