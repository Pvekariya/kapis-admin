"use client";

import { useEffect, useState } from "react";

type ProductType = "raw" | "finished";
type PaymentMode = "cash" | "upi" | "bank";

export default function PurchasePage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [supplier, setSupplier] = useState("");
  const [invoice, setInvoice] = useState("");
  const [productType, setProductType] = useState<ProductType>("raw");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [showNewProduct, setShowNewProduct] = useState(false);

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  const [items, setItems] = useState([
    { productId: "", qty: "", price: "", customName: "" },
  ]);

  useEffect(() => {
    fetch(`/api/inventory?type=${productType}`)
      .then(res => res.json())
      .then(setInventory);
  }, [productType]);

  const addRow = () =>
    setItems([...items, { productId: "", qty: "", price: "", customName: "" }]);

  const update = (i: number, key: string, val: any) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [key]: val };

    if (key === "productId" && val === "custom") {
      setShowNewProduct(true);
    }

    setItems(copy);
  };

  const total = items.reduce(
    (t, i) => t + Number(i.qty || 0) * Number(i.price || 0),
    0
  );

  const saveNewProduct = async () => {
    if (!newProductName) return;

    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newProductName,
        type: productType,
        price: Number(newProductPrice || 0),
      }),
    });

    const data = await res.json();

    if (data.success) {
      setShowNewProduct(false);
      setNewProductName("");
      setNewProductPrice("");
      fetch(`/api/inventory?type=${productType}`)
        .then(res => res.json())
        .then(setInventory);
    }
  };

  const savePurchase = async () => {
    if (!supplier || !invoice) {
      alert("Supplier and Invoice are required");
      return;
    }

    const preparedItems = items.map(i => ({
      ...i,
      productName:
        inventory.find(p => p._id === i.productId)?.name || i.customName,
    }));

    const res = await fetch("/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice,
        supplier,
        productType,
        paymentMode,
        items: preparedItems,
        total,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Purchase saved");
      window.location.reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-10 px-6">
      <h2 className="text-2xl font-semibold text-[var(--text)]">
        Purchase Entry
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          placeholder="Supplier name"
          value={supplier}
          onChange={e => setSupplier(e.target.value)}
          className="input w-full h-11"
        />
        <input
          placeholder="Invoice"
          value={invoice}
          onChange={e => setInvoice(e.target.value)}
          className="input w-full h-11"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={productType}
          onChange={e => setProductType(e.target.value as ProductType)}
          className="input w-full h-11"
        >
          <option value="raw">Raw Materials</option>
          <option value="finished">Finished Products</option>
        </select>

        <select
          value={paymentMode}
          onChange={e => setPaymentMode(e.target.value as PaymentMode)}
          className="input w-full h-11"
        >
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="bank">Bank</option>
        </select>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-3">
        {items.map((i, idx) => (
          <div key={idx} className="flex gap-3 items-center">
            <select
              value={i.productId}
              onChange={e => update(idx, "productId", e.target.value)}
              className="input w-52"
            >
              <option value="">Select Product</option>
              {inventory.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
              <option value="custom">+ Add New Product</option>
            </select>

            <input
              type="number"
              placeholder="Qty"
              value={i.qty}
              onChange={e => update(idx, "qty", e.target.value)}
              className="input w-24"
            />

            <input
              type="number"
              placeholder="Price"
              value={i.price}
              onChange={e => update(idx, "price", e.target.value)}
              className="input w-28"
            />
          </div>
        ))}

        <button
          onClick={addRow}
          className="text-sm px-3 py-1 rounded-md bg-[#79addc] text-white hover:opacity-90 transition"
        >
          + Add Row
        </button>
      </div>

      {showNewProduct && (
        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <h3 className="font-semibold">Add New Product</h3>
          <input
            placeholder="Product name"
            value={newProductName}
            onChange={e => setNewProductName(e.target.value)}
            className="input w-full"
          />
          <input
            type="number"
            placeholder="Default price"
            value={newProductPrice}
            onChange={e => setNewProductPrice(e.target.value)}
            className="input w-full"
          />
          <button
            onClick={saveNewProduct}
            className="px-4 py-2 rounded-md bg-[#ffc09f] text-black hover:opacity-90 transition"
          >
            Save Product
          </button>
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <span className="text-lg font-bold">Total: ₹{total}</span>
        <button
          onClick={savePurchase}
          className="px-6 py-2 rounded-md bg-[#adf7b6] text-black hover:opacity-90 transition"
        >
          Save Purchase
        </button>
      </div>
    </div>
  );
}
