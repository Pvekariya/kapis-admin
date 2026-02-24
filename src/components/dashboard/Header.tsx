"use client";

import React, { JSX, useEffect, useRef, useState } from "react";
import { useEffect as useEffectAuth } from "react";
import { useEffect as useEffectNotif } from "react";
import { Bell, Moon, Sun, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header(): JSX.Element | null {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement | null>(null);

    const [user, setUser] = useState<any>({ email: "", avatar: "", name: "" });
    const [showProfileModal, setShowProfileModal] = useState(false);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = typeof window !== "undefined" && localStorage.getItem("theme");
        if (saved === "dark" || saved === "light") {
            setTheme(saved);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        localStorage.setItem("theme", theme);
    }, [theme, mounted]);

    useEffectAuth(() => {
        fetch("/api/auth/me", { credentials: "include" })
            .then(res => res.json())
            .then(data => setUser(data || { email: "", avatar: "", name: "" }))
            .catch(() => setUser({ email: "", avatar: "", name: "" }));
    }, []);

    useEffectNotif(() => {
        const load = () => {
            fetch("/api/notifications")
                .then(res => res.json())
                .then(data => setNotifications(Array.isArray(data) ? data : []))
                .catch(() => setNotifications([]));
        };

        load();
        const i = setInterval(load, 5000);
        return () => clearInterval(i);
    }, []);

    useEffect(() => {
        function onDocumentClick(e: MouseEvent) {
            if (
                profileRef.current &&
                !profileRef.current.contains(e.target as Node)
            ) {
                setProfileOpen(false);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setProfileOpen(false);
        }

        if (profileOpen) {
            document.addEventListener("click", onDocumentClick);
            document.addEventListener("keydown", onKey);
        }
        return () => {
            document.removeEventListener("click", onDocumentClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [profileOpen]);

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        router.push("/login");
    }

    async function clearNotifications() {
        await fetch("/api/notifications", { method: "DELETE" });
        setNotifications([]);
    }

    if (!mounted) return null;

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#1f2430] bg-[#0f1117] relative z-40">
            <div className="w-80" />

            <div className="flex items-center gap-4">
                <div className="relative">
                    <button
                        onClick={() => setNotifOpen(o => !o)}
                        className="p-2 rounded-lg hover:bg-[#1a1f2b] transition relative"
                        aria-label="Notifications"
                    >
                        <Bell size={18} />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] px-1 rounded">
                                {notifications.length}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-[#0b0d12] border border-[#1f2430] rounded-md shadow-lg z-50">
                            <div className="flex justify-between items-center p-3 border-b border-[#15171a]">
                                <span className="text-sm font-medium">Notifications</span>
                                <button
                                    onClick={clearNotifications}
                                    className="text-xs text-red-400 hover:underline"
                                >
                                    Clear all
                                </button>
                            </div>

                            <div className="max-h-80 overflow-auto text-sm">
                                {notifications.length === 0 && (
                                    <div className="p-3 text-[#9aa4b2]">No notifications</div>
                                )}

                                {notifications.map((n, i) => (
                                    <div key={i} className="p-3 border-b border-[#15171a]">
                                        <div>{n.message}</div>
                                        <div className="text-xs text-[#9aa4b2]">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                    className="p-2 rounded-lg hover:bg-[#1a1f2b] transition"
                    aria-label="Toggle theme"
                >
                    {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                <div className="relative" ref={profileRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setProfileOpen((s) => !s);
                        }}
                        className="w-9 h-9 rounded-full overflow-hidden shadow-sm ring-1 ring-white/5 hover:ring-white/10 transition"
                        aria-haspopup="true"
                        aria-expanded={profileOpen}
                        aria-label="Profile"
                    >
                        <img src={user?.avatar || "/avatar.png"} alt="Profile" className="w-full h-full object-cover" />
                    </button>

                    {profileOpen && (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 mt-2 w-56 bg-[#0b0d12] border border-[#1f2430] rounded-md shadow-lg z-50"
                        >
                            <div className="p-4 border-b border-[#15171a]">
                                <div className="flex items-center gap-3">
                                    <img src={user?.avatar || "/avatar.png"} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <div className="text-sm font-medium">PV ERP SOLUTIONS</div>
                                        <div className="text-xs text-[#9aa4b2]">{user?.email || "Unknown user"}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-2">
                                <button
                                    onClick={() => {
                                        setProfileOpen(false);
                                        setShowProfileModal(true);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-[#121418] transition text-sm"
                                >
                                    Edit profile
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-[#121418] transition text-sm text-red-400"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showProfileModal && user && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
                    <div className="bg-[#0b0d12] border border-[#1f2430] p-6 rounded-xl w-96 space-y-4">
                        <h3 className="text-lg font-semibold">Profile</h3>

                        <input
                            placeholder="Name"
                            value={user.name || ""}
                            onChange={e => setUser({ ...user, name: e.target.value })}
                            className="w-full bg-[#11151c] border border-[#1f2430] p-2 rounded"
                        />

                        <input
                            value={user.email}
                            onChange={e => setUser({ ...user, email: e.target.value })}
                            className="w-full bg-[#11151c] border border-[#1f2430] p-2 rounded"
                        />

                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const reader = new FileReader();
                                reader.onload = () => {
                                    setUser({ ...user, avatar: reader.result });
                                };
                                reader.readAsDataURL(file);
                            }}
                            className="w-full bg-[#11151c] border border-[#1f2430] p-2 rounded"
                        />

                        <button
                            onClick={async () => {
                                const res = await fetch("/api/auth/update", {
                                    method: "POST",
                                    credentials: "include",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        email: user.email,
                                        avatar: user.avatar,
                                        name: user.name
                                    }),
                                });

                                const data = await res.json();
                                console.log("PROFILE SAVE:", data);

                                if (!data.success) {
                                    alert("Save failed");
                                    return;
                                }

                                // reload user from server so UI matches DB
                                const me = await fetch("/api/auth/me", { credentials: "include" });
                                const fresh = await me.json();
                                setUser(fresh);

                                alert("Profile updated");
                                setShowProfileModal(false);
                            }}
                            className="bg-green-600 w-full py-2 rounded"
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}
