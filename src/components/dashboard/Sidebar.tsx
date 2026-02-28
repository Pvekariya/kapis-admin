"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  FileText,
  BarChart3,
  Users,
  ShoppingCart,
  BookOpen,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const nav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Leads", href: "/admin/leads", icon: Users },
  {
    name: "Inventory",
    icon: Boxes,
    subItems: [
      { name: "Raw Materials", href: "/admin/inventory/raw" },
      { name: "Finished Products", href: "/admin/inventory/finished" },
    ],
  },
  {
    name: "Staff",
    icon: Users,
    subItems: [
      { name: "Staff List", href: "/admin/staff" },
      { name: "Attendance", href: "/admin/staff/attendance" },
      { name: "Salary", href: "/admin/staff/salary" },
      { name: "Raw Material Consumption", href: "/admin/staff/consumption" },
    ],
  },
  { name: "Daybook", href: "/admin/daybook", icon: BookOpen },
  { name: "Billing", href: "/admin/bill", icon: FileText },
  { name: "Sales Ledger", href: "/admin/sales", icon: BarChart3 },
  { name: "Purchase", href: "/admin/purchase", icon: ShoppingCart },
  { name: "Purchase Ledger", href: "/admin/purchase/ledger", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize(); // run on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);

  const isActive = (href?: string) => href && pathname === href;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-[#0f1117] px-4 py-3 border-b border-[#1f2430]">
        <h1 className="text-lg font-bold">PV ERP</h1>
        <button onClick={() => setMobileOpen(true)}>
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky md:top-0 z-50 top-0 left-0 h-screen flex-shrink-0 ${
          collapsed ? "w-20" : "w-64"
        } bg-[#0f1117] border-r border-[#1f2430] flex flex-col justify-between px-4 py-6 transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-10 px-1">
            {!collapsed && (
              <h1 className="text-lg font-bold tracking-wide">
                PV ERP SOLUTION
              </h1>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded hover:bg-[#1a1f2b]"
              >
                {collapsed ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronLeft size={16} />
                )}
              </button>

              <button
                className="md:hidden"
                onClick={() => setMobileOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <nav className="space-y-3 text-sm mt-2">
            {nav.map((item, i) => {
              const Icon = item.icon;

              if (item.subItems) {
                const isInventory = item.name === "Inventory";
                const isStaff = item.name === "Staff";
                const isOpen = isInventory
                  ? inventoryOpen
                  : isStaff
                  ? staffOpen
                  : false;

                const toggle = () => {
                  if (isInventory) setInventoryOpen(!inventoryOpen);
                  if (isStaff) setStaffOpen(!staffOpen);
                };

                return (
                  <div key={i}>
                    <button
                      onClick={toggle}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all duration-200 ${
                        isOpen
                          ? "bg-[#1a1f2b] text-white"
                          : "text-gray-400 hover:bg-[#1a1f2b] hover:text-white"
                      }`}
                    >
                      <Icon size={18} />
                      {!collapsed && <span>{item.name}</span>}
                    </button>

                    {!collapsed && (
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="pl-10 space-y-1 pb-2">
                          {item.subItems.map((sub, idx) => (
                            <Link
                              key={idx}
                              href={sub.href}
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center px-4 py-3 rounded-md text-sm transition-all duration-200 ${
                                isActive(sub.href)
                                  ? "bg-[#222733] text-white"
                                  : "text-gray-400 hover:text-white hover:bg-[#161b25]"
                              }`}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={i}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.href)
                      ? "bg-[#1a1f2b] text-white"
                      : "text-gray-400 hover:bg-[#1a1f2b] hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 text-gray-500">
        </div>
      </aside>
    </>
  );
}