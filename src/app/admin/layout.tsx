import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.className} flex min-h-screen text-gray-200 bg-gradient-to-br from-[#0a0f1c] via-[#0b1020] to-[#05070d]`}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}