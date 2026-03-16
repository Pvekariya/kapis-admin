"use client";

import { useEffect, useState } from "react";

export default function StaffPage() {
  const [staff, setStaff]       = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name:"", phone:"", role:"", monthlySalary:"" });

  const load = async () => {
    const res  = await fetch("/api/staff", { credentials:"include" });
    const data = await res.json();
    setStaff(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await fetch("/api/staff", {
          method:"PUT", credentials:"include",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ ...form, id:editingId, monthlySalary:Number(form.monthlySalary) }),
        });
        setEditingId(null);
      } else {
        await fetch("/api/staff", {
          method:"POST", credentials:"include",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ ...form, monthlySalary:Number(form.monthlySalary) }),
        });
      }
      setForm({ name:"", phone:"", role:"", monthlySalary:"" });
      await load();
    } finally { setSaving(false); }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("Delete this staff member?")) return;
    await fetch("/api/staff", {
      method:"DELETE", credentials:"include",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const editStaff = (s: any) => {
    setForm({ name:s.name, phone:s.phone, role:s.role, monthlySalary:s.monthlySalary });
    setEditingId(s._id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name:"", phone:"", role:"", monthlySalary:"" });
  };

  const FIELDS: [string, string, string][] = [
    ["Name","name","text"],
    ["Phone","phone","text"],
    ["Role","role","text"],
    ["Monthly Salary","monthlySalary","number"],
  ];

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Staff List</h1>
        <span className="badge badge-blue">{staff.length} members</span>
      </div>

      {/* Form */}
      <div className="g-card" style={{ padding:"18px 20px", marginBottom:20 }}>
        <p className="section-label">{editingId ? "Edit Staff Member" : "Add Staff Member"}</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr) auto", gap:12, alignItems:"end" }}>
          {FIELDS.map(([label, key, type]) => (
            <div className="field" key={key}>
              <label className="field-label">{label}</label>
              <input className="input" type={type} placeholder={label}
                value={(form as any)[key]}
                onChange={e => setForm({ ...form, [key]:e.target.value })} />
            </div>
          ))}
          <div style={{ display:"flex", gap:8, alignSelf:"flex-end" }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "…" : editingId ? "Update" : "Add"}
            </button>
            {editingId && (
              <button className="btn" onClick={cancelEdit}>Cancel</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="g-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Salary</th>
              <th>Advance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>
                <div style={{ display:"flex", justifyContent:"center", padding:"32px 0" }}>
                  <div className="spinner" />
                </div>
              </td></tr>
            ) : staff.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:"center", padding:"32px 0", color:"var(--text-3)" }}>
                No staff members yet
              </td></tr>
            ) : staff.map(s => (
              <tr key={s._id}>
                <td style={{ fontWeight:500 }}>{s.name}</td>
                <td style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"var(--text-2)" }}>{s.phone}</td>
                <td><span className="badge badge-neutral">{s.role || "—"}</span></td>
                <td style={{ fontWeight:600, fontFamily:"'DM Mono',monospace", fontSize:13 }}>
                  ₹{Number(s.monthlySalary||0).toLocaleString("en-IN")}
                </td>
                <td style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"var(--amber)" }}>
                  ₹{Number(s.advanceBalance||0).toLocaleString("en-IN")}
                </td>
                <td>
                  <span className={`badge ${s.status === "active" ? "badge-green" : "badge-neutral"}`}>
                    {s.status || "active"}
                  </span>
                </td>
                <td>
                  <div style={{ display:"flex", gap:6 }}>
                    <button className="btn btn-sm" onClick={() => editStaff(s)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteStaff(s._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}