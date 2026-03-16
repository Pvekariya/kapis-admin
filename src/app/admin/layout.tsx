import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

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
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}