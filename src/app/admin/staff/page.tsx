"use client";

import { useEffect, useState, useTransition } from "react";
import {
  FIELD_LIMITS,
  sanitizePhone,
  validateOptionalText,
  validatePhone,
  validateRequiredText,
} from "@/lib/entityValidation";

export default function StaffPage() {
  const [staff, setStaff]         = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", phone: "", role: "", monthlySalary: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    const res  = await fetch("/api/staff", { credentials: "include" });
    const data = await res.json();
    setStaff(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    nextErrors.name = validateRequiredText(form.name, "Name", FIELD_LIMITS.personName);
    nextErrors.phone = validatePhone(form.phone, false);
    nextErrors.role = validateOptionalText(form.role, "Role", FIELD_LIMITS.role);
    if (!form.monthlySalary.trim()) {
      nextErrors.monthlySalary = "Monthly salary is required";
    } else if (Number.isNaN(Number(form.monthlySalary)) || Number(form.monthlySalary) < 0) {
      nextErrors.monthlySalary = "Monthly salary must be 0 or more";
    }

    return Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => value));
  };

  const handleSubmit = async () => {
    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch("/api/staff", {
          method: "PUT", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, id: editingId, monthlySalary: Number(form.monthlySalary) }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrors({ form: data.error || "Failed to update staff" });
          return;
        }
        setEditingId(null);
      } else {
        const res = await fetch("/api/staff", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, monthlySalary: Number(form.monthlySalary) }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrors({ form: data.error || "Failed to add staff" });
          return;
        }
      }
      setForm({ name: "", phone: "", role: "", monthlySalary: "" });
      setErrors({});
      await load();
    } finally { setSaving(false); }
  };

  // ✅ FIX: wrap confirm + fetch in startTransition to avoid blocking INP
  //         also update UI optimistically before awaiting the network call
  const deleteStaff = (id: string, name: string) => {
    startTransition(async () => {
      const yes = window.confirm(`Delete "${name}"?`);
      if (!yes) return;

      // Optimistic UI — remove from list immediately
      setStaff(prev => prev.filter(s => s._id !== id));
      setDeletingId(id);

      try {
        const res = await fetch("/api/staff", {
          method: "DELETE", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = await res.json();
        if (!data.success) {
          // Rollback if server rejected
          await load();
        }
      } catch {
        // Network error — rollback
        await load();
      } finally {
        setDeletingId(null);
      }
    });
  };

  const editStaff = (s: any) => {
    setForm({ name: s.name, phone: s.phone, role: s.role, monthlySalary: s.monthlySalary });
    setEditingId(s._id);
    setErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", phone: "", role: "", monthlySalary: "" });
    setErrors({});
  };

  const FIELDS: [string, string, string][] = [
    ["Name", "name", "text"],
    ["Phone", "phone", "text"],
    ["Role", "role", "text"],
    ["Monthly Salary", "monthlySalary", "number"],
  ];

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Staff List</h1>
        <span className="badge badge-blue">{staff.length} members</span>
      </div>

      {/* Form */}
      <div className="g-card" style={{ padding: "18px 20px", marginBottom: 20 }}>
        <p className="section-label">{editingId ? "Edit Staff Member" : "Add Staff Member"}</p>
        {errors.form && (
          <div style={{ marginBottom: 12, color: "#f87171", fontSize: 12 }}>{errors.form}</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr) auto", gap: 12, alignItems: "end" }}>
          {FIELDS.map(([label, key, type]) => (
            <div className="field" key={key}>
              <label className="field-label">{label}</label>
              <input className="input" type={type} placeholder={key === "phone" ? "+91 9876543210" : label}
                maxLength={key === "name" ? FIELD_LIMITS.personName : key === "phone" ? FIELD_LIMITS.phone : key === "role" ? FIELD_LIMITS.role : undefined}
                style={errors[key] ? { borderColor: "#ef4444" } : undefined}
                value={(form as any)[key]}
                onChange={e => setForm({ ...form, [key]: key === "phone" ? sanitizePhone(e.target.value) : e.target.value })} />
              {errors[key] && (
                <p style={{ marginTop: 4, fontSize: 11, color: "#f87171" }}>{errors[key]}</p>
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, alignSelf: "flex-end" }}>
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
              <th>Name</th><th>Phone</th><th>Role</th>
              <th>Salary</th><th>Advance</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>
                <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                  <div className="spinner" />
                </div>
              </td></tr>
            ) : staff.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)" }}>
                No staff members yet
              </td></tr>
            ) : staff.map(s => {
              const isDeleting = deletingId === s._id;
              return (
                <tr key={s._id} style={{ opacity: isDeleting ? 0.4 : 1, transition: "opacity 0.2s" }}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: "var(--text-2)" }}>{s.phone}</td>
                  <td><span className="badge badge-neutral">{s.role || "—"}</span></td>
                  <td style={{ fontWeight: 600, fontFamily: "'DM Mono',monospace", fontSize: 13 }}>
                    ₹{Number(s.monthlySalary || 0).toLocaleString("en-IN")}
                  </td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: "var(--amber)" }}>
                    ₹{Number(s.advanceBalance || 0).toLocaleString("en-IN")}
                  </td>
                  <td>
                    <span className={`badge ${s.status === "active" ? "badge-green" : "badge-neutral"}`}>
                      {s.status || "active"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => editStaff(s)}
                        disabled={isDeleting}
                      >
                        Edit
                      </button>
                      {/* ✅ FIX: optimistic delete with visual feedback */}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteStaff(s._id, s.name)}
                        disabled={isDeleting}
                        style={{ minWidth: 52 }}
                      >
                        {isDeleting ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
