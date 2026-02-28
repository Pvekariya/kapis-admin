"use client";

import { useEffect, useState } from "react";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "",
    monthlySalary: "",
  });

  const fetchStaff = async () => {
    const res = await fetch("/api/staff");
    const data = await res.json();
    setStaff(data);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async () => {
    if (editingId) {
      await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editingId }),
      });
      setEditingId(null);
    } else {
      await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setForm({ name: "", phone: "", role: "", monthlySalary: "" });
    fetchStaff();
  };

  const deleteStaff = async (id: string) => {
    await fetch("/api/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    fetchStaff();
  };

  const editStaff = (s: any) => {
    setForm({
      name: s.name,
      phone: s.phone,
      role: s.role,
      monthlySalary: s.monthlySalary,
    });
    setEditingId(s._id);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Staff List
      </h1>

      {/* Form */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 grid grid-cols-4 gap-4">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input"
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="input"
        />
        <input
          placeholder="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="input"
        />
        <input
          type="number"
          placeholder="Monthly Salary"
          value={form.monthlySalary}
          onChange={(e) =>
            setForm({ ...form, monthlySalary: e.target.value })
          }
          className="input"
        />

        <button
          onClick={handleSubmit}
          className="col-span-4 btn bg-blue-600 hover:bg-blue-700 transition"
        >
          {editingId ? "Update Staff" : "Add Staff"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-[var(--border)] text-[var(--text-secondary)] text-sm">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Role</th>
              <th className="p-3">Salary</th>
              <th className="p-3">Advance</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s._id} className="border-b border-[var(--border)] hover:bg-[var(--hover)] transition">
                <td className="p-3">{s.name}</td>
                <td className="p-3">{s.phone}</td>
                <td className="p-3">{s.role}</td>
                <td className="p-3">₹ {s.monthlySalary}</td>
                <td className="p-3">₹ {s.advanceBalance || 0}</td>
                <td className="p-3">{s.status}</td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => editStaff(s)}
                    className="text-blue-500 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteStaff(s._id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}