"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ── Icons ─────────────────────────────────────────────────── */
const Icons = {
  Dashboard: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Leads: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Inventory: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Staff: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Daybook: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  Billing: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Sales: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Purchase: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  Ledger: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  Menu: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

/* ── Nav config ─────────────────────────────────────────────── */
const NAV = [
  { label: "Dashboard",       href: "/admin",                  icon: "Dashboard" },
  { label: "Leads",           href: "/admin/leads",            icon: "Leads"     },
  {
    label: "Inventory", icon: "Inventory",
    children: [
      { label: "Raw Materials",     href: "/admin/inventory/raw"      },
      { label: "Finished Products", href: "/admin/inventory/finished" },
    ],
  },
  {
    label: "Staff", icon: "Staff",
    children: [
      { label: "Staff List",  href: "/admin/staff"             },
      { label: "Attendance",  href: "/admin/staff/attendance"  },
      { label: "Salary",      href: "/admin/staff/salary"      },
      { label: "Production",  href: "/admin/staff/consumption" },
    ],
  },
  { label: "Daybook",         href: "/admin/daybook",          icon: "Daybook"   },
  { label: "Billing",         href: "/admin/bill",             icon: "Billing"   },
  { label: "Sales Ledger",    href: "/admin/sales",            icon: "Sales"     },
  { label: "Purchase",        href: "/admin/purchase",         icon: "Purchase"  },
  { label: "Purchase Ledger", href: "/admin/purchase/ledger",  icon: "Ledger"    },
] as const;

/* ── Component ──────────────────────────────────────────────── */
export default function Sidebar() {
  const pathname = usePathname();

  // collapsed = icon-only mode
  const [collapsed, setCollapsed] = useState(false);
  // mobileOpen = drawer visible on small screens
  const [mobileOpen, setMobileOpen] = useState(false);
  // which group menus are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  /* Auto-open the group whose child is currently active */
  useEffect(() => {
    const updates: Record<string, boolean> = {};
    NAV.forEach(item => {
      if ("children" in item) {
        const hasActive = item.children.some(c => pathname === c.href);
        if (hasActive) updates[item.label] = true;
      }
    });
    if (Object.keys(updates).length) {
      setOpenGroups(prev => ({ ...prev, ...updates }));
    }
  }, [pathname]);

  /* Collapse sidebar on small screens automatically */
  useEffect(() => {
    const check = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname === href;

  /* ── Styles ────────────────────────────────────────────────── */
  const W = collapsed ? 72 : 240;

  return (
    <>
      {/* ── Mobile top bar ───────────────────────────────────── */}
      <div style={{
        display: "none",
        position: "fixed", top: 0, left: 0, right: 0, height: 56,
        background: "var(--sidebar-bg)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", zIndex: 50,
      }} className="sb-mobile-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark /><span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>PV ERP</span>
        </div>
        <button style={btnReset} onClick={() => setMobileOpen(true)}>
          <Icons.Menu />
        </button>
      </div>

      {/* ── Mobile backdrop ──────────────────────────────────── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            zIndex: 60,
          }}
        />
      )}

      {/* ── Sidebar shell ───────────────────────────────────── */}
      <aside
        style={{
          width: W, minWidth: W,
          height: "100vh",
          position: "sticky", top: 0,
          display: "flex", flexDirection: "column",
          background: "var(--sidebar-bg)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid var(--border)",
          transition: "width 0.25s ease, min-width 0.25s ease",
          zIndex: 40,
          overflow: "hidden",
          flexShrink: 0,
        }}
        className="sb-desktop"
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "16px 0" : "16px 14px",
          borderBottom: "1px solid var(--border)",
          minHeight: 60,
          gap: 8,
        }}>
          {collapsed ? (
            /* When collapsed — clicking logo mark expands */
            <button
              onClick={() => setCollapsed(false)}
              style={{ ...btnReset, cursor: "pointer" }}
              title="Expand sidebar"
            >
              <LogoMark />
            </button>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <LogoMark />
                <span style={{
                  fontSize: 13, fontWeight: 600, color: "var(--text)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  PV ERP Solutions
                </span>
              </div>
              {/* Collapse button */}
              <button
                onClick={() => setCollapsed(true)}
                style={{
                  ...btnReset,
                  width: 26, height: 26, borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--glass)",
                  color: "var(--text-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                }}
                title="Collapse sidebar"
              >
                <Icons.ChevronLeft />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          padding: "10px 8px",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          {NAV.map(item => {
            const IconComp = Icons[item.icon as keyof typeof Icons];

            /* Group item (has children) */
            if ("children" in item) {
              const isOpen = !!openGroups[item.label];
              const anyChildActive = item.children.some(c => pathname === c.href);

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    style={{
                      ...btnReset,
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: collapsed ? "10px 0" : "9px 12px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "background 0.15s, color 0.15s",
                      color: anyChildActive || isOpen ? "var(--text)" : "var(--text-2)",
                      background: anyChildActive
                        ? "linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.10))"
                        : isOpen ? "var(--glass-hover)" : "transparent",
                      border: anyChildActive
                        ? "1px solid rgba(59,130,246,0.25)"
                        : "1px solid transparent",
                      fontSize: 13,
                      fontWeight: anyChildActive || isOpen ? 500 : 400,
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <IconComp />
                    {!collapsed && (
                      <>
                        <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                        <span style={{
                          color: "var(--text-3)",
                          display: "flex",
                          transition: "transform 0.2s",
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}>
                          <Icons.ChevronDown />
                        </span>
                      </>
                    )}
                  </button>

                  {/* Sub-items — only show when not collapsed AND group is open */}
                  {!collapsed && isOpen && (
                    <div style={{ paddingTop: 2, paddingBottom: 4 }}>
                      {item.children.map(child => {
                        const active = isActive(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "7px 12px 7px 38px",
                              borderRadius: 8,
                              textDecoration: "none",
                              color: active ? "var(--accent)" : "var(--text-2)",
                              background: active ? "var(--info-bg)" : "transparent",
                              fontSize: 12.5,
                              fontWeight: active ? 500 : 400,
                              transition: "background 0.15s, color 0.15s",
                            }}
                          >
                            <span style={{
                              width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                              background: active ? "var(--accent)" : "var(--text-3)",
                            }} />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            /* Regular nav item */
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: collapsed ? "10px 0" : "9px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: active ? "#fff" : "var(--text-2)",
                  background: active
                    ? "linear-gradient(135deg,rgba(59,130,246,0.28),rgba(99,102,241,0.20))"
                    : "transparent",
                  border: active ? "1px solid rgba(59,130,246,0.35)" : "1px solid transparent",
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  whiteSpace: "nowrap", overflow: "hidden",
                }}
              >
                <IconComp />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: "10px 8px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-start",
          alignItems: "center",
        }}>
          {collapsed ? (
            /* Expand button in footer when collapsed */
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              style={{
                ...btnReset,
                width: 32, height: 32, borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--glass)",
                color: "var(--text-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", margin: "0 auto",
              }}
            >
              <Icons.ChevronRight />
            </button>
          ) : (
            <p style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.06em", margin: 0, padding: "0 4px" }}>
              PV ERP v2.0 · Secured
            </p>
          )}
        </div>
      </aside>

      {/* ── Mobile drawer ───────────────────────────────────── */}
      <aside
        style={{
          position: "fixed", top: 0, left: 0,
          width: 240, height: "100vh",
          display: "flex", flexDirection: "column",
          background: "var(--sidebar-bg)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid var(--border)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          zIndex: 70,
          overflow: "hidden",
        }}
        className="sb-mobile-drawer"
      >
        {/* Mobile drawer header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 14px", borderBottom: "1px solid var(--border)", minHeight: 60,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>PV ERP Solutions</span>
          </div>
          <button style={{ ...btnReset, color: "var(--text-2)", cursor: "pointer" }} onClick={() => setMobileOpen(false)}>
            <Icons.X />
          </button>
        </div>

        {/* Mobile nav — same logic, never collapsed */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(item => {
            const IconComp = Icons[item.icon as keyof typeof Icons];

            if ("children" in item) {
              const isOpen = !!openGroups[item.label];
              const anyChildActive = item.children.some(c => pathname === c.href);
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    style={{
                      ...btnReset, width: "100%",
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                      color: anyChildActive || isOpen ? "var(--text)" : "var(--text-2)",
                      background: anyChildActive
                        ? "linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.10))"
                        : isOpen ? "var(--glass-hover)" : "transparent",
                      border: anyChildActive ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                      fontSize: 13, fontWeight: anyChildActive || isOpen ? 500 : 400,
                    }}
                  >
                    <IconComp />
                    <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                    <span style={{ color: "var(--text-3)", display: "flex", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                      <Icons.ChevronDown />
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ paddingTop: 2, paddingBottom: 4 }}>
                      {item.children.map(child => {
                        const active = isActive(child.href);
                        return (
                          <Link
                            key={child.href} href={child.href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "7px 12px 7px 38px", borderRadius: 8, textDecoration: "none",
                              color: active ? "var(--accent)" : "var(--text-2)",
                              background: active ? "var(--info-bg)" : "transparent",
                              fontSize: 12.5, fontWeight: active ? 500 : 400,
                            }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: active ? "var(--accent)" : "var(--text-3)" }} />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = isActive(item.href);
            return (
              <Link
                key={item.href} href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10, textDecoration: "none",
                  color: active ? "#fff" : "var(--text-2)",
                  background: active ? "linear-gradient(135deg,rgba(59,130,246,0.28),rgba(99,102,241,0.20))" : "transparent",
                  border: active ? "1px solid rgba(59,130,246,0.35)" : "1px solid transparent",
                  fontSize: 13, fontWeight: active ? 500 : 400,
                }}
              >
                <IconComp />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sb-desktop    { display: none !important; }
          .sb-mobile-bar { display: flex !important; }
        }
        @media (min-width: 769px) {
          .sb-mobile-drawer { display: none !important; }
          .sb-mobile-bar    { display: none !important; }
        }
        nav a:hover, nav button:hover { opacity: 0.9; }
      `}</style>
    </>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */
const LogoMark = () => (
  <div style={{
    width: 32, height: 32, borderRadius: 8,
    background: "linear-gradient(135deg,#3b82f6,#6366f1)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em",
  }}>PV</div>
);

const btnReset: React.CSSProperties = {
  background: "none", border: "none", padding: 0,
  color: "inherit", font: "inherit",
};