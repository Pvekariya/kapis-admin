"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Analytics() {
  const [revenue, setRevenue] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetch("/api/analytics/weekly-revenue")
      .then(res => res.json())
      .then(raw => {
        const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        const map: any = {};
        const products = new Set<string>();

        raw.forEach((d: any) => products.add(d._id.product));

        days.forEach(day => {
          map[day] = { day };
          products.forEach(p => map[day][p] = 0);
        });

        raw.forEach((d: any) => {
          const day = days[d._id.day - 1];
          map[day][d._id.product] = d.revenue / 1000;
        });

        setRevenue(Object.values(map));
      });

    fetch("/api/analytics/inventory-distribution")
      .then(res => res.json())
      .then(setInventory);

    fetch("/api/analytics/top-products")
      .then(res => res.json())
      .then(setTopProducts);
  }, []);

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"];

  const glass =
    "bg-[#0b0f19]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,255,255,0.08)] hover:shadow-[0_0_50px_rgba(0,255,255,0.18)] transition-all";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

      {/* Weekly Revenue */}
      <div className={`${glass} md:col-span-2`}>
        <h3 className="mb-4 font-semibold">Weekly Revenue (K)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenue}>
            <defs>
              <linearGradient id="fadeA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="fadeB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />

            {revenue.length > 0 &&
              Object.keys(revenue[0])
                .filter(k => k !== "day")
                .slice(0, 2)
                .map((key, i) => (
                  <Area
                    key={i}
                    type="monotone"
                    dataKey={key}
                    stroke={i === 0 ? "#22c55e" : "#f59e0b"}
                    fill={i === 0 ? "url(#fadeA)" : "url(#fadeB)"}
                    strokeWidth={3}
                  />
                ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Inventory Donut */}
      <div className={glass}>
        <h3 className="mb-4 font-semibold">Inventory Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={inventory} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
              {inventory.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products */}
      <div className={glass}>
        <h3 className="mb-4 font-semibold">Top Selling Products</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={topProducts} dataKey="value" nameKey="name" outerRadius={110}>
              {topProducts.map((entry, i) => (
                <Cell key={i} fill={`hsl(${i * 60},70%,50%)`} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Growth 
      <div className={`${glass} md:col-span-2`}>
        <h3 className="mb-4 font-semibold">Revenue Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenue}>
            <defs>
              <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />

            {revenue.length > 0 &&
              Object.keys(revenue[0])
                .filter(k => k !== "day")
                .slice(0, 2)
                .map((key, i) => (
                  <Area
                    key={i}
                    type="monotone"
                    dataKey={key}
                    stroke={i === 0 ? "#22c55e" : "#f59e0b"}
                    fill={i === 0 ? "url(#colorA)" : "url(#colorB)"}
                    strokeWidth={3}
                  />
                ))}
          </AreaChart>
        </ResponsiveContainer>
      </div> */}

    </div>
  );
}