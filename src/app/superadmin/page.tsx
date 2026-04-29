"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FIELD_LIMITS,
  sanitizeEmail,
  sanitizeGstin,
  sanitizeHexColor,
  sanitizePhone,
  sanitizeSlug,
  validateEmail,
  validateGstin,
  validateHexColor,
  validateOptionalText,
  validatePhone,
  validateRequiredText,
  validateSlug,
  validateUrl,
} from "@/lib/entityValidation";

const fmt = (d: string) => new Date(d).toLocaleDateString();
type FieldErrors = Record<string, string>;

const emptyInvoiceHeader = {
  companyName: "",
  address: "",
  phone: "",
  email: "",
  gstin: "",
};

export default function SuperAdminPage() {
  const router = useRouter();
  const [tenants, setTenants]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [form, setForm] = useState({
    name:"", slug:"", adminEmail:"", adminPassword:"",
    primaryColor:"#3b82f6", logoUrl:"",
    invoiceHeader:{ ...emptyInvoiceHeader },
  });
  const [editForm, setEditForm] = useState<any>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [editErrors, setEditErrors] = useState<FieldErrors>({});

  const load = async () => {
    const res  = await fetch("/api/superadmin/tenants", { credentials:"include" });
    if (res.status === 401 || res.status === 403) { router.push("/superadmin/login"); return; }
    const data = await res.json();
    setTenants(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const validateTenantForm = (values: typeof form) => {
    const errors: FieldErrors = {};

    errors.name = validateRequiredText(values.name, "Company name", FIELD_LIMITS.companyName);
    errors.slug = validateSlug(values.slug);
    errors.adminEmail = validateEmail(values.adminEmail, true);
    if (!values.adminPassword.trim()) {
      errors.adminPassword = "Admin password is required";
    } else if (values.adminPassword.length < 6) {
      errors.adminPassword = "Admin password must be at least 6 characters";
    } else if (values.adminPassword.length > FIELD_LIMITS.password) {
      errors.adminPassword = `Admin password must be ${FIELD_LIMITS.password} characters or less`;
    }
    errors.primaryColor = validateHexColor(values.primaryColor);
    errors.logoUrl = validateUrl(values.logoUrl);
    errors.invoiceCompanyName = validateOptionalText(values.invoiceHeader.companyName, "Invoice company name", FIELD_LIMITS.companyName);
    errors.invoiceAddress = validateOptionalText(values.invoiceHeader.address, "Address", FIELD_LIMITS.address);
    errors.invoicePhone = validatePhone(values.invoiceHeader.phone, false);
    errors.invoiceEmail = validateEmail(values.invoiceHeader.email, false);
    errors.invoiceGstin = validateGstin(values.invoiceHeader.gstin);

    return Object.fromEntries(Object.entries(errors).filter(([, value]) => value));
  };

  const validateEditTenantForm = (values: any) => {
    const errors: FieldErrors = {};

    errors.name = validateRequiredText(values.name || "", "Company name", FIELD_LIMITS.companyName);
    errors.primaryColor = validateHexColor(values.primaryColor || "");
    errors.logoUrl = validateUrl(values.logoUrl || "");
    errors.invoiceCompanyName = validateOptionalText(values.invoiceHeader?.companyName || "", "Invoice company name", FIELD_LIMITS.companyName);
    errors.invoiceAddress = validateOptionalText(values.invoiceHeader?.address || "", "Address", FIELD_LIMITS.address);
    errors.invoicePhone = validatePhone(values.invoiceHeader?.phone || "", false);
    errors.invoiceEmail = validateEmail(values.invoiceHeader?.email || "", false);
    errors.invoiceGstin = validateGstin(values.invoiceHeader?.gstin || "");

    return Object.fromEntries(Object.entries(errors).filter(([, value]) => value));
  };

  const inputError = (errors: FieldErrors, key: string) =>
    errors[key]
      ? { border: "1px solid rgba(239,68,68,0.5)" }
      : {};

  const renderError = (errors: FieldErrors, key: string) =>
    errors[key]
      ? <p style={{ marginTop: 4, fontSize: 11, color: "#f87171" }}>{errors[key]}</p>
      : null;

  const createTenant = async () => {
    const payload = {
      ...form,
      adminEmail: sanitizeEmail(form.adminEmail),
      slug: sanitizeSlug(form.slug),
      primaryColor: sanitizeHexColor(form.primaryColor),
      logoUrl: form.logoUrl.trim(),
      invoiceHeader: {
        ...form.invoiceHeader,
        email: sanitizeEmail(form.invoiceHeader.email),
        phone: sanitizePhone(form.invoiceHeader.phone),
        gstin: sanitizeGstin(form.invoiceHeader.gstin),
      },
    };
    const errors = validateTenantForm(payload);
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      setError("Fix the highlighted fields before saving");
      return;
    }

    setError(""); setCreating(true);
    try {
      const res  = await fetch("/api/superadmin/tenants", {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setSuccess(`Tenant "${payload.name}" created! Subdomain: ${payload.slug}.yourdomain.com`);
      setShowForm(false);
      setForm({ name:"",slug:"",adminEmail:"",adminPassword:"",primaryColor:"#3b82f6",logoUrl:"",
        invoiceHeader:{...emptyInvoiceHeader}});
      setFormErrors({});
      load();
    } finally { setCreating(false); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    if (active) {
      if (!confirm("Deactivate this tenant? They will lose access.")) return;
      await fetch("/api/superadmin/tenants", {
        method:"DELETE", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id }),
      });
    } else {
      await fetch("/api/superadmin/tenants", {
        method:"PATCH", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id, active: true }),
      });
    }
    load();
  };

  const saveEdit = async () => {
    const payload = {
      id: editingId,
      ...editForm,
      primaryColor: sanitizeHexColor(editForm.primaryColor || ""),
      logoUrl: (editForm.logoUrl || "").trim(),
      invoiceHeader: {
        ...emptyInvoiceHeader,
        ...editForm.invoiceHeader,
        email: sanitizeEmail(editForm.invoiceHeader?.email || ""),
        phone: sanitizePhone(editForm.invoiceHeader?.phone || ""),
        gstin: sanitizeGstin(editForm.invoiceHeader?.gstin || ""),
      },
    };
    const errors = validateEditTenantForm(payload);
    setEditErrors(errors);
    if (Object.keys(errors).length) {
      setError("Fix the highlighted fields before saving");
      return;
    }

    await fetch("/api/superadmin/tenants", {
      method:"PATCH", credentials:"include",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(payload),
    });
    setEditingId(null);
    setEditErrors({});
    load();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method:"POST", credentials:"include" });
    router.push("/superadmin/login");
  };

  const S = {
    root: { minHeight:"100vh", background:"#060810", color:"#eef0f5", fontFamily:"'DM Sans',sans-serif", padding:32 } as React.CSSProperties,
    card: { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:20, marginBottom:16 } as React.CSSProperties,
    input: { width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:9, padding:"8px 12px", color:"#eef0f5", fontSize:13, fontFamily:"inherit", outline:"none" } as React.CSSProperties,
    label: { fontSize:11, color:"#8b95a8", marginBottom:4, display:"block", fontWeight:500, letterSpacing:"0.04em" } as React.CSSProperties,
    btn: { padding:"8px 16px", borderRadius:9, border:"none", cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:"inherit" } as React.CSSProperties,
  };

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:"-0.03em", margin:0 }}>
            PV ERP — Superadmin
          </h1>
          <p style={{ fontSize:12, color:"#8b95a8", marginTop:4 }}>
            Manage all tenant businesses
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={{ ...S.btn, background:"rgba(59,130,246,0.2)", color:"#60a5fa", border:"1px solid rgba(59,130,246,0.3)" }}
            onClick={() => setShowForm(true)}>
            + New Tenant
          </button>
          <button style={{ ...S.btn, background:"rgba(239,68,68,0.15)", color:"#f87171", border:"1px solid rgba(239,68,68,0.25)" }}
            onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:28 }}>
        {[
          { label:"Total Tenants", value:tenants.length,                         color:"#3b82f6" },
          { label:"Active",        value:tenants.filter(t=>t.active).length,     color:"#22c55e" },
          { label:"Inactive",      value:tenants.filter(t=>!t.active).length,    color:"#ef4444" },
        ].map(c=>(
          <div key={c.label} style={{ ...S.card, padding:"16px 20px" }}>
            <p style={{ fontSize:11, color:"#8b95a8", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>{c.label}</p>
            <p style={{ fontSize:28, fontWeight:700, color:c.color, margin:0 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {success && (
        <div style={{ background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#4ade80" }}>
          ✓ {success}
          <button onClick={()=>setSuccess("")} style={{ ...S.btn, float:"right", padding:"0 6px", background:"none", color:"#8b95a8" }}>✕</button>
        </div>
      )}

      {/* Tenant list */}
      <div style={S.card}>
        <h2 style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>All Tenants</h2>
        {loading ? (
          <p style={{ color:"#8b95a8", fontSize:13 }}>Loading…</p>
        ) : tenants.length===0 ? (
          <p style={{ color:"#8b95a8", fontSize:13 }}>No tenants yet. Create one above.</p>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                {["Name","Slug","Users","Plan","Status","Created","Actions"].map(h=>(
                  <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, color:"#8b95a8", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map(t=>(
                <tr key={t._id} style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding:"12px", fontWeight:600 }}>
                    <div>{t.name}</div>
                    <div style={{ fontSize:11, color:"#8b95a8", marginTop:2 }}>{t.invoiceHeader?.gstin||""}</div>
                  </td>
                  <td style={{ padding:"12px" }}>
                    <span style={{ fontFamily:"monospace", fontSize:12, background:"rgba(59,130,246,0.12)", color:"#60a5fa", padding:"2px 8px", borderRadius:5 }}>
                      {t.slug}
                    </span>
                  </td>
                  <td style={{ padding:"12px", color:"#8b95a8" }}>{t.userCount ?? 0}</td>
                  <td style={{ padding:"12px", color:"#8b95a8", textTransform:"capitalize" }}>{t.plan||"starter"}</td>
                  <td style={{ padding:"12px" }}>
                    <span style={{
                      padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:500,
                      background:t.active?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)",
                      color:t.active?"#4ade80":"#f87171",
                      border:`1px solid ${t.active?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.25)"}`,
                    }}>
                      {t.active?"Active":"Inactive"}
                    </span>
                  </td>
                  <td style={{ padding:"12px", color:"#8b95a8", fontSize:12 }}>{fmt(t.createdAt)}</td>
                  <td style={{ padding:"12px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button style={{ ...S.btn, padding:"4px 10px", background:"rgba(255,255,255,0.06)", color:"#eef0f5", border:"1px solid rgba(255,255,255,0.1)", fontSize:12 }}
                        onClick={()=>{ setEditingId(t._id); setEditForm({ name:t.name, primaryColor:t.primaryColor, logoUrl:t.logoUrl, invoiceHeader:t.invoiceHeader||{} }); }}>
                        Edit
                      </button>
                      <button style={{ ...S.btn, padding:"4px 10px", fontSize:12,
                        background:t.active?"rgba(239,68,68,0.12)":"rgba(34,197,94,0.12)",
                        color:t.active?"#f87171":"#4ade80",
                        border:`1px solid ${t.active?"rgba(239,68,68,0.25)":"rgba(34,197,94,0.3)"}`,
                      }}
                        onClick={()=>toggleActive(t._id, t.active)}>
                        {t.active?"Deactivate":"Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create tenant modal */}
      {showForm && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20 }}>
          <div style={{ ...S.card, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <h3 style={{ fontSize:17, fontWeight:600, margin:0 }}>Create New Tenant</h3>
              <button style={{ ...S.btn, padding:"4px 10px", background:"none", color:"#8b95a8" }} onClick={()=>setShowForm(false)}>✕</button>
            </div>

            {error && <div style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#f87171", marginBottom:14 }}>{error}</div>}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              {[["Company Name","name","text"],["Subdomain Slug","slug","text"],["Admin Email","adminEmail","email"],["Admin Password","adminPassword","password"]].map(([l,k,t])=>(
                <div key={k}>
                  <label style={S.label}>{l}</label>
                    <input style={{ ...S.input, ...inputError(formErrors, k) }} type={t} value={(form as any)[k]}
                    maxLength={k === "name" ? FIELD_LIMITS.companyName : k === "slug" ? FIELD_LIMITS.slug : k === "adminEmail" ? FIELD_LIMITS.email : FIELD_LIMITS.password}
                    placeholder={k==="slug"?"e.g. acme (no spaces)":""}
                    onChange={e=>setForm({...form,[k]:
                      k === "slug" ? sanitizeSlug(e.target.value)
                      : k === "adminEmail" ? sanitizeEmail(e.target.value)
                      : e.target.value
                    })}/>
                  {renderError(formErrors, k)}
                </div>
              ))}
            </div>

            <p style={{ fontSize:11, color:"#8b95a8", marginBottom:14, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>Branding</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={S.label}>Primary Color</label>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input type="color" value={form.primaryColor} onChange={e=>setForm({...form,primaryColor:sanitizeHexColor(e.target.value)})}
                    style={{ width:38, height:38, borderRadius:8, border:"1px solid rgba(255,255,255,0.12)", background:"none", cursor:"pointer", padding:2 }}/>
                  <input style={{ ...S.input, flex:1, ...inputError(formErrors, "primaryColor") }} value={form.primaryColor} maxLength={FIELD_LIMITS.color}
                    onChange={e=>setForm({...form,primaryColor:sanitizeHexColor(e.target.value)})}/>
                </div>
                {renderError(formErrors, "primaryColor")}
              </div>
              <div>
                <label style={S.label}>Logo URL</label>
                <input style={{ ...S.input, ...inputError(formErrors, "logoUrl") }} value={form.logoUrl} maxLength={FIELD_LIMITS.logoUrl} placeholder="https://..."
                  onChange={e=>setForm({...form,logoUrl:e.target.value})}/>
                {renderError(formErrors, "logoUrl")}
              </div>
            </div>

            <p style={{ fontSize:11, color:"#8b95a8", marginBottom:14, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>Invoice Header</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
              {[["Company Name","companyName"],["Address","address"],["Phone","phone"],["Email","email"],["GSTIN","gstin"]].map(([l,k])=>(
                <div key={k}>
                  <label style={S.label}>{l}</label>
                  <input
                    style={{ ...S.input, ...inputError(formErrors, `invoice${k.charAt(0).toUpperCase()}${k.slice(1)}`) }}
                    value={(form.invoiceHeader as any)[k]||""}
                    maxLength={k === "companyName" ? FIELD_LIMITS.companyName : k === "address" ? FIELD_LIMITS.address : k === "phone" ? FIELD_LIMITS.phone : k === "email" ? FIELD_LIMITS.email : FIELD_LIMITS.gstin}
                    placeholder={k === "phone" ? "+91 9876543210" : undefined}
                    onChange={e=>setForm({...form,invoiceHeader:{...form.invoiceHeader,[k]:
                      k === "phone" ? sanitizePhone(e.target.value)
                      : k === "email" ? sanitizeEmail(e.target.value)
                      : k === "gstin" ? sanitizeGstin(e.target.value)
                      : e.target.value
                    }})}/>
                  {renderError(formErrors, `invoice${k.charAt(0).toUpperCase()}${k.slice(1)}`)}
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...S.btn, flex:2, background:"#3b82f6", color:"#fff" }}
                disabled={creating} onClick={createTenant}>
                {creating?"Creating…":"Create Tenant"}
              </button>
              <button style={{ ...S.btn, flex:1, background:"rgba(255,255,255,0.06)", color:"#eef0f5", border:"1px solid rgba(255,255,255,0.1)" }}
                onClick={()=>setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit tenant modal */}
      {editingId && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20 }}>
          <div style={{ ...S.card, width:"100%", maxWidth:500, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <h3 style={{ fontSize:17, fontWeight:600, margin:0 }}>Edit Tenant</h3>
              <button style={{ ...S.btn, padding:"4px 10px", background:"none", color:"#8b95a8" }} onClick={()=>setEditingId(null)}>✕</button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
              <div>
                <label style={S.label}>Company Name</label>
                <input style={{ ...S.input, ...inputError(editErrors, "name") }} value={editForm.name||""} maxLength={FIELD_LIMITS.companyName}
                  onChange={e=>setEditForm({...editForm,name:e.target.value})}/>
                {renderError(editErrors, "name")}
              </div>
              <div>
                <label style={S.label}>Primary Color</label>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input type="color" value={editForm.primaryColor||"#3b82f6"}
                    onChange={e=>setEditForm({...editForm,primaryColor:sanitizeHexColor(e.target.value)})}
                    style={{ width:38,height:38,borderRadius:8,border:"1px solid rgba(255,255,255,0.12)",background:"none",cursor:"pointer",padding:2 }}/>
                  <input style={{ ...S.input,flex:1, ...inputError(editErrors, "primaryColor") }} value={editForm.primaryColor||""} maxLength={FIELD_LIMITS.color}
                    onChange={e=>setEditForm({...editForm,primaryColor:sanitizeHexColor(e.target.value)})}/>
                </div>
                {renderError(editErrors, "primaryColor")}
              </div>
              <div>
                <label style={S.label}>Logo URL</label>
                <input style={{ ...S.input, ...inputError(editErrors, "logoUrl") }} value={editForm.logoUrl||""} maxLength={FIELD_LIMITS.logoUrl} placeholder="https://..."
                  onChange={e=>setEditForm({...editForm,logoUrl:e.target.value})}/>
                {renderError(editErrors, "logoUrl")}
              </div>
              <p style={{ fontSize:11, color:"#8b95a8", textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>Invoice Header</p>
              {[["Company Name","companyName"],["Address","address"],["Phone","phone"],["Email","email"],["GSTIN","gstin"]].map(([l,k])=>(
                <div key={k}>
                  <label style={S.label}>{l}</label>
                  <input style={{ ...S.input, ...inputError(editErrors, `invoice${k.charAt(0).toUpperCase()}${k.slice(1)}`) }} value={editForm.invoiceHeader?.[k]||""}
                    maxLength={k === "companyName" ? FIELD_LIMITS.companyName : k === "address" ? FIELD_LIMITS.address : k === "phone" ? FIELD_LIMITS.phone : k === "email" ? FIELD_LIMITS.email : FIELD_LIMITS.gstin}
                    placeholder={k === "phone" ? "+91 9876543210" : undefined}
                    onChange={e=>setEditForm({...editForm,invoiceHeader:{...editForm.invoiceHeader,[k]:
                      k === "phone" ? sanitizePhone(e.target.value)
                      : k === "email" ? sanitizeEmail(e.target.value)
                      : k === "gstin" ? sanitizeGstin(e.target.value)
                      : e.target.value
                    }}})}/>
                  {renderError(editErrors, `invoice${k.charAt(0).toUpperCase()}${k.slice(1)}`)}
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button style={{ ...S.btn, flex:2, background:"#3b82f6", color:"#fff" }} onClick={saveEdit}>Save Changes</button>
              <button style={{ ...S.btn, flex:1, background:"rgba(255,255,255,0.06)", color:"#eef0f5", border:"1px solid rgba(255,255,255,0.1)" }} onClick={()=>setEditingId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
