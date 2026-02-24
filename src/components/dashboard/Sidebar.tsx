"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Boxes, FileText, BarChart3, Users, Settings, ShoppingCart, BookOpen, Menu, X } from "lucide-react";

const nav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Leads", href: "/admin/leads", icon: Users },
  { name: "Inventory", href: "/admin/inventory", icon: Boxes },
  { name: "Billing", href: "/admin/bill", icon: FileText },
  { name: "Sales Ledger", href: "/admin/sales", icon: BarChart3 },
  { name: "Purchase", href: "/admin/purchase", icon: ShoppingCart },
  { name: "Purchase Ledger", href: "/admin/purchase/ledger", icon: BookOpen },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-[#0f1117] px-4 py-3 border-b border-[#1f2430]">
        <h1 className="text-lg font-bold">PV ERP</h1>
        <button onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-64 bg-[#0f1117] border-r border-[#1f2430] flex flex-col justify-between p-6 transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div>
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-xl font-bold tracking-wide">PV ERP SOLUTION</h1>
            <button className="md:hidden" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-3 text-sm">
            {nav.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={i}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition hover:bg-[#1a1f2b] hover:text-white text-gray-400"
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 text-gray-500">
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1f2b] rounded-lg cursor-pointer">
            <Settings size={18} />
            <span className="text-sm">Settings</span>
          </div>
          <p className="text-xs opacity-50 px-4">Kapis Lights Admin Panel</p>
        </div>
      </aside>
    </>
  );
}