import { Suspense } from "react";
import dynamic from "next/dynamic";
import type { Metadata } from "next";

// ── Eagerly load sidebar + header (always visible, no delay) ──
import Sidebar from "@/components/dashboard/Sidebar";
import Header  from "@/components/dashboard/Header";

// ── Per-page metadata helper ───────────────────────────────────
export const metadata: Metadata = {
  title: "Dashboard | PV ERP",
  robots: { index: false, follow: false },
};

// ── Loading fallback for main content ─────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: 300, width: "100%",
    }}>
      <div className="spinner" />
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--bg)",
      color: "var(--text)",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden",
      }}>
        <Header />
        <main style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          overflowX: "hidden",
          /* ✅ FIX: isolate scroll so sidebar doesn't repaint on scroll */
          isolation: "isolate",
        }}>
          {/*
            ✅ FIX: Suspense boundary so individual page loads
            show a spinner instead of blocking the whole layout
          */}
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}