"use client";

import Link from "next/link";
import { LayoutDashboard, Boxes, FileText, BarChart3, Users, Settings, ShoppingCart, BookOpen } from "lucide-react";

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
  return (
    <aside className="w-64 min-h-screen bg-[#0f1117] border-r border-[#1f2430] flex flex-col justify-between p-6">

      <div>
        <h1 className="text-xl font-bold mb-10 tracking-wide">
          PV ERP SOLUTION
        </h1>

        <nav className="space-y-3 text-sm">
          {nav.map((item, i) => {
            const Icon = item.icon;

            return (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition hover:bg-[#1a1f2b] hover:text-white text-gray-400"
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
  );
}