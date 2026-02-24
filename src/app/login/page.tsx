"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IBM_Plex_Sans } from "next/font/google";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const login = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target;
    const email = form[0].value;
    const password = form[1].value;

    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      alert("Invalid login");
      setLoading(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <div className={`${plex.className} min-h-screen flex relative overflow-hidden text-white`}>

      <div className="absolute inset-0 bg-gradient-to-br from-[#04060f] via-[#07122a] to-[#020409]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,80,255,0.18),transparent_40%)]" />

      {/* LEFT */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <h1 className="text-6xl md:text-7xl font-light tracking-widest opacity-90 select-none text-center">
          PV ERP SOLUTIONS
        </h1>
      </div>

      {/* RIGHT */}
      <div className="w-[420px] flex items-center justify-center relative z-10">
        <form onSubmit={login} className="w-[340px] backdrop-blur-xl bg-[#0b1220]/80 border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,120,255,0.15)] space-y-6">

          <div className="text-center bg-white/5 border border-white/10 rounded-xl py-3 mb-4">
            <p className="tracking-widest text-sm opacity-80">ADMIN PANEL</p>
          </div>

          <h2 className="text-2xl font-semibold text-center">Login</h2>

          <div className="space-y-2">
            <label className="text-sm opacity-70">Username</label>
            <input required className="w-full bg-black/30 border border-white/10 rounded-full px-4 py-2 outline-none focus:border-blue-500 transition" />
          </div>

          <div className="space-y-2">
            <label className="text-sm opacity-70">Password</label>
            <input type="password" required className="w-full bg-black/30 border border-white/10 rounded-full px-4 py-2 outline-none focus:border-blue-500 transition" />
          </div>

          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-full font-semibold transition shadow-[0_0_25px_rgba(0,120,255,0.4)] hover:shadow-[0_0_45px_rgba(0,120,255,0.7)]">
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-center text-xs opacity-60">Secure ERP Access</p>

        </form>
      </div>
    </div>
  );
}