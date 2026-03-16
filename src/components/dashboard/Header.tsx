"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const BellIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const LogOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

function getBreadcrumb(p: string) {
  const map: Record<string, string> = {
    "/admin": "Dashboard", "/admin/leads": "Leads",
    "/admin/inventory/raw": "Raw Materials", "/admin/inventory/finished": "Finished Products",
    "/admin/staff": "Staff List", "/admin/staff/attendance": "Attendance",
    "/admin/staff/salary": "Salary", "/admin/staff/consumption": "Production",
    "/admin/daybook": "Daybook", "/admin/bill": "Billing",
    "/admin/sales": "Sales Ledger", "/admin/purchase": "Purchase",
    "/admin/purchase/ledger": "Purchase Ledger",
  };
  return map[p] || "Dashboard";
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [user, setUser] = useState({ email: "", name: "", avatar: "" });
  const [editForm, setEditForm] = useState({ email: "", name: "", avatar: "" });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("erp-theme") as "dark" | "light" | null;
    const t = saved || "dark";
    setTheme(t);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(t);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    localStorage.setItem("erp-theme", next);
  };

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json()).then(d => { if (d) { setUser(d); setEditForm(d); } }).catch(() => {});
    fetch("/api/notifications", { credentials: "include" })
      .then(r => r.json()).then(d => Array.isArray(d) && setNotifications(d)).catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!mounted) return null;

  /* shared dropdown style */
  const dropStyle: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 8px)", right: 0,
    background: "var(--glass-modal)",
    backdropFilter: "blur(28px) saturate(200%)",
    WebkitBackdropFilter: "blur(28px) saturate(200%)",
    border: "1px solid var(--border-2)",
    borderRadius: 14,
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    zIndex: 300,
    overflow: "hidden",
    animation: "slideUp 0.15s ease",
  };

  const iconBtnStyle: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 9,
    border: "1px solid var(--border-2)",
    background: "var(--glass-2)",
    color: "var(--text-2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
  };

  return (
    <>
      <header style={{
        height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--glass-2)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        position: "sticky", top: 0, zIndex: 30, flexShrink: 0,
      }}>

        {/* Breadcrumb */}
        <div>
          <p style={{ fontSize: 10.5, color: "var(--text-3)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 1 }}>
            PV ERP Solutions
          </p>
          <p style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em", lineHeight: 1 }}>
            {getBreadcrumb(pathname)}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* Theme */}
          <button style={iconBtnStyle} onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Notifications */}
          <div style={{ position: "relative" }} ref={notifRef}>
            <button style={{ ...iconBtnStyle, position: "relative" }}
              onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}>
              <BellIcon />
              {notifications.length > 0 && (
                <span style={{
                  position: "absolute", top: 7, right: 7,
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--red)", border: "1.5px solid var(--bg)",
                }} />
              )}
            </button>

            {notifOpen && (
              <div style={{ ...dropStyle, width: 300 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 10px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)" }}>Notifications</span>
                  {notifications.length > 0 && (
                    <button onClick={async () => {
                      await fetch("/api/notifications", { method: "DELETE", credentials: "include" });
                      setNotifications([]);
                    }} style={{ fontSize: 11, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer" }}>
                      Clear all
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <p style={{ padding: "20px 14px", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>All caught up</p>
                  ) : notifications.slice(0, 20).map((n: any) => (
                    <div key={n._id} style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 12.5, color: "var(--text-1)", marginBottom: 2 }}>{n.message}</p>
                      <p style={{ fontSize: 10.5, color: "var(--text-3)" }}>{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div style={{ position: "relative" }} ref={profileRef}>
            <button onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid var(--border-2)", overflow: "hidden", cursor: "pointer", background: "var(--glass-2)", padding: 0 }}>
              {user.avatar ? (
                <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", fontSize: 12, fontWeight: 600 }}>
                  {(user.name || user.email || "A")[0].toUpperCase()}
                </div>
              )}
            </button>

            {profileOpen && (
              <div style={{ ...dropStyle, width: 220 }}>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 600 }}>
                    {user.avatar ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user.name || user.email || "A")[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name || "Admin"}</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                  </div>
                </div>
                <div style={{ padding: 6 }}>
                  {[
                    { label: "Edit profile", icon: <EditIcon />, onClick: () => { setProfileOpen(false); setShowEditModal(true); }, color: "var(--text-2)" },
                    { label: "Sign out", icon: <LogOutIcon />, onClick: async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); router.push("/login"); }, color: "var(--red)" },
                  ].map((a) => (
                    <button key={a.label} onClick={a.onClick} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 9,
                      padding: "8px 10px", borderRadius: 8,
                      background: "none", border: "none", color: a.color,
                      fontSize: 13, cursor: "pointer", transition: "background 0.12s", textAlign: "left",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--glass-hover)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      {a.icon}{a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Profile</h3>
              <button className="btn btn-icon btn-sm" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--border-2)" }}>
                {editForm.avatar ? <img src={editForm.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>{(editForm.name || editForm.email || "A")[0].toUpperCase()}</span>}
              </div>
              <label style={{ fontSize: 12, color: "var(--accent)", cursor: "pointer", background: "var(--blue-dim)", border: "1px solid var(--blue-border)", borderRadius: 8, padding: "6px 12px" }}>
                Upload photo
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const r = new FileReader(); r.onload = () => setEditForm(p => ({ ...p, avatar: r.result as string }));
                  r.readAsDataURL(f);
                }} />
              </label>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Name", "name", "text"], ["Email", "email", "email"]].map(([lbl, key, type]) => (
                <div className="field" key={key}>
                  <label className="field-label">{lbl}</label>
                  <input className="input" type={type} value={(editForm as any)[key]}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary w-full" style={{ flex: 1 }} disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const res = await fetch("/api/auth/update", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
                    const d = await res.json();
                    if (d.success) { setUser(editForm); setShowEditModal(false); }
                  } finally { setSaving(false); }
                }}>
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}