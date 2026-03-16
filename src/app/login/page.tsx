"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      router.push("/admin");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      {/* Ambient background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      {/* Left — branding */}
      <div style={styles.left}>
        <div style={styles.brandWrap}>
          <div style={styles.logoMark}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="11" height="11" rx="3" fill="#3b82f6" opacity="0.9"/>
              <rect x="15" y="2" width="11" height="11" rx="3" fill="#3b82f6" opacity="0.5"/>
              <rect x="2" y="15" width="11" height="11" rx="3" fill="#3b82f6" opacity="0.5"/>
              <rect x="15" y="15" width="11" height="11" rx="3" fill="#3b82f6" opacity="0.9"/>
            </svg>
          </div>
          <h1 style={styles.brandName}>PV ERP</h1>
          <p style={styles.brandTag}>SOLUTIONS</p>

          <div style={styles.featureList}>
            {[
              { icon: "⚡", text: "Real-time inventory tracking" },
              { icon: "📊", text: "Financial analytics & daybook" },
              { icon: "👥", text: "Staff & payroll management" },
              { icon: "🧾", text: "GST-ready billing & invoicing" },
            ].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — login card */}
      <div style={styles.right}>
        <form onSubmit={login} style={styles.card}>

          {/* Card header */}
          <div style={styles.cardHeader}>
            <div style={styles.adminBadge}>ADMIN PANEL</div>
            <h2 style={styles.cardTitle}>Welcome back</h2>
            <p style={styles.cardSub}>Sign in to your ERP dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <span style={{ fontSize: 14 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email address</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@kapisadmin.com"
                required
                autoComplete="email"
                style={styles.input}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPass ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span style={styles.spinnerWrap}>
                <span style={styles.spinner} />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>

          <p style={styles.secureNote}>
            🔒 Secure admin access · Session expires in 12 hours
          </p>
        </form>
      </div>
    </div>
  );
}

/* ── Inline styles (no Tailwind dependency for login page) ── */
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    display: "flex",
    background: "#07090f",
    position: "relative",
    overflow: "hidden",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  blob1: {
    position: "absolute",
    top: "-20%",
    left: "-10%",
    width: 600,
    height: 600,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    bottom: "-20%",
    right: "-10%",
    width: 700,
    height: 700,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  blob3: {
    position: "absolute",
    top: "40%",
    left: "30%",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  left: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 40px",
    position: "relative",
    zIndex: 1,
  },
  brandWrap: {
    maxWidth: 420,
  },
  logoMark: {
    marginBottom: 20,
  },
  brandName: {
    fontSize: 56,
    fontWeight: 700,
    color: "#f0f4f8",
    letterSpacing: "-0.04em",
    margin: "0 0 4px",
    lineHeight: 1,
  },
  brandTag: {
    fontSize: 13,
    fontWeight: 500,
    color: "#3b82f6",
    letterSpacing: "0.18em",
    margin: "0 0 48px",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    fontSize: 18,
    width: 36,
    height: 36,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,
  featureText: {
    fontSize: 14,
    color: "#8b949e",
  },
  right: {
    width: 460,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 32px",
    position: "relative",
    zIndex: 1,
  },
  card: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: "36px 32px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  cardHeader: {
    marginBottom: 28,
  },
  adminBadge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.14em",
    color: "#3b82f6",
    background: "rgba(59,130,246,0.12)",
    border: "1px solid rgba(59,130,246,0.25)",
    borderRadius: 20,
    padding: "3px 10px",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: 600,
    color: "#f0f4f8",
    letterSpacing: "-0.02em",
    margin: "0 0 6px",
  },
  cardSub: {
    fontSize: 13,
    color: "#8b949e",
    margin: 0,
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(239,68,68,0.10)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "#f87171",
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "#8b949e",
    marginBottom: 6,
    letterSpacing: "0.02em",
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    color: "#484f58",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
  } as React.CSSProperties,
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "10px 40px 10px 38px",
    color: "#f0f4f8",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    background: "none",
    border: "none",
    color: "#484f58",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 0,
  } as React.CSSProperties,
  submitBtn: {
    width: "100%",
    background: "#3b82f6",
    border: "none",
    borderRadius: 10,
    padding: "12px",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    marginTop: 8,
    marginBottom: 16,
    boxShadow: "0 0 24px rgba(59,130,246,0.35)",
    transition: "background 0.2s, box-shadow 0.2s, transform 0.1s",
  },
  spinnerWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  } as React.CSSProperties,
  spinner: {
    width: 14,
    height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  } as React.CSSProperties,
  secureNote: {
    textAlign: "center",
    fontSize: 11,
    color: "#484f58",
    margin: 0,
  },
};
