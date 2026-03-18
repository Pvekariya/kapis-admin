"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ── Icons ──────────────────────────────────────────────────── */
function IcoDashboard() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>; }
function IcoLeads()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IcoInventory() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>; }
function IcoStaff()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IcoDaybook()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function IcoBilling()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function IcoSales()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }
function IcoPurchase()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>; }
function IcoLedger()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg>; }
function IcoBom()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>; }
function ChevDown()     { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>; }
function ChevRight()    { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>; }
function ChevLeft()     { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>; }
function MenuIco()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function CloseIco()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

function PvLogo() {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
      background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em",
      boxShadow: "0 0 16px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
      position: "relative",
    }}>
      PV
    </div>
  );
}

/* ── Nav config ─────────────────────────────────────────────── */
type NavLink  = { kind:"link";  label:string; href:string;  Icon:React.FC };
type NavGroup = { kind:"group"; label:string; Icon:React.FC; children:{label:string;href:string}[] };

const NAV: (NavLink|NavGroup)[] = [
  { kind:"link",  label:"Dashboard",       href:"/admin",                 Icon:IcoDashboard },
  { kind:"link",  label:"Leads",           href:"/admin/leads",           Icon:IcoLeads     },
  { kind:"group", label:"Inventory",       Icon:IcoInventory, children:[
    { label:"Raw Materials",     href:"/admin/inventory/raw"      },
    { label:"Finished Products", href:"/admin/inventory/finished" },
  ]},
  { kind:"group", label:"Staff",           Icon:IcoStaff, children:[
    { label:"Staff List",  href:"/admin/staff"             },
    { label:"Attendance",  href:"/admin/staff/attendance"  },
    { label:"Salary",      href:"/admin/staff/salary"      },
    { label:"Production",  href:"/admin/staff/consumption" },
  ]},
  { kind:"link",  label:"Daybook",         href:"/admin/daybook",         Icon:IcoDaybook  },
  { kind:"link",  label:"Billing",         href:"/admin/bill",            Icon:IcoBilling  },
  { kind:"link",  label:"Sales Ledger",    href:"/admin/sales",           Icon:IcoSales    },
  { kind:"link",  label:"Purchase",        href:"/admin/purchase",        Icon:IcoPurchase },
  { kind:"link",  label:"Purchase Ledger", href:"/admin/purchase/ledger", Icon:IcoLedger   },
  { kind:"link",  label:"BOM",             href:"/admin/bom",             Icon:IcoBom      },
];

const R: React.CSSProperties = { background:"none",border:"none",padding:0,color:"inherit",font:"inherit",cursor:"pointer",outline:"none" };

export default function Sidebar() {
  const pathname                    = usePathname();
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobile]     = useState(false);
  const [openGroups, setGroups]     = useState<Record<string,boolean>>({});

  useEffect(() => {
    NAV.forEach(n => {
      if (n.kind==="group" && n.children.some(c=>pathname===c.href))
        setGroups(p=>({...p,[n.label]:true}));
    });
  }, [pathname]);

  useEffect(() => {
    const fn = () => { if(window.innerWidth<1024) setCollapsed(true); };
    fn(); window.addEventListener("resize",fn);
    return ()=>window.removeEventListener("resize",fn);
  }, []);

  const isOn   = (href:string) => pathname===href;
  const toggle = (label:string) => setGroups(p=>({...p,[label]:!p[label]}));
  const sideW  = collapsed ? 68 : 248;

  /* Active link style — glowing pill */
  const linkSt = (on:boolean, mobile=false): React.CSSProperties => ({
    display:"flex", alignItems:"center", gap:10,
    padding: (collapsed&&!mobile) ? "10px 0" : "8px 12px",
    justifyContent: (collapsed&&!mobile) ? "center" : "flex-start",
    borderRadius:10, textDecoration:"none",
    color: on ? "#fff" : "var(--text-2)",
    background: on
      ? "linear-gradient(135deg,rgba(59,130,246,0.22),rgba(99,102,241,0.16))"
      : "transparent",
    border: on ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent",
    fontSize:13, fontWeight: on?500:400,
    transition:"all .18s ease",
    whiteSpace:"nowrap" as const, overflow:"hidden",
    /* Glow on active */
    boxShadow: on ? "0 0 16px var(--accent-glow)" : "none",
    position:"relative",
  });

  const grpSt = (open:boolean, any:boolean, mobile=false): React.CSSProperties => ({
    ...R,
    display:"flex", alignItems:"center", gap:10, width:"100%",
    padding: (collapsed&&!mobile) ? "10px 0" : "8px 12px",
    justifyContent: (collapsed&&!mobile) ? "center" : "flex-start",
    borderRadius:10,
    color: any||open ? "var(--text-1)" : "var(--text-2)",
    background: any
      ? "linear-gradient(135deg,rgba(59,130,246,0.12),rgba(99,102,241,0.08))"
      : open ? "var(--glass-hover)" : "transparent",
    border: any ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
    fontSize:13, fontWeight: any||open?500:400,
    transition:"all .18s ease",
    boxShadow: any ? "0 0 14px rgba(99,102,241,0.12)" : "none",
  });

  const subSt = (on:boolean): React.CSSProperties => ({
    display:"flex", alignItems:"center", gap:8,
    padding:"6px 12px 6px 36px", borderRadius:8, textDecoration:"none",
    color: on ? "#a5b4fc" : "var(--text-2)",
    background: on ? "rgba(99,102,241,0.10)" : "transparent",
    fontSize:12.5, fontWeight: on?500:400,
    transition:"all .15s",
    borderLeft: on ? "2px solid rgba(99,102,241,0.5)" : "2px solid transparent",
    marginLeft: 2,
  });

  /* ── Hero sidebar base ─────────────────────────────────────── */
  const sidebarStyle: React.CSSProperties = {
    background: "var(--sidebar-bg)",
    backdropFilter: "blur(24px) saturate(160%)",
    WebkitBackdropFilter: "blur(24px) saturate(160%)",
    borderRight: "1px solid var(--border-2)",
    boxShadow: "4px 0 20px rgba(0,0,0,0.12)",
  };

  function NavList({ mobile=false }: { mobile?:boolean }) {
    return (
      <>
        {NAV.map(n => {
          if (n.kind==="link") {
            const on = isOn(n.href);
            return (
              <Link key={n.href} href={n.href}
                style={linkSt(on,mobile)}
                onClick={()=>setMobile(false)}
                title={(collapsed&&!mobile)?n.label:undefined}>
                {/* Active left accent bar */}
                {on && !collapsed && (
                  <span style={{
                    position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
                    width:3, height:"60%", background:"linear-gradient(180deg,#3b82f6,#6366f1)",
                    borderRadius:"0 2px 2px 0",
                  }}/>
                )}
                <span style={{ flexShrink:0, opacity: on?1:0.7 }}><n.Icon /></span>
                {(!collapsed||mobile) && <span>{n.label}</span>}
              </Link>
            );
          }

          const open = !!openGroups[n.label];
          const any  = n.children.some(c=>isOn(c.href));

          return (
            <div key={n.label}>
              <button style={grpSt(open,any,mobile)}
                onClick={()=>toggle(n.label)}
                title={(collapsed&&!mobile)?n.label:undefined}>
                <span style={{ flexShrink:0, opacity: any||open?1:0.7 }}><n.Icon /></span>
                {(!collapsed||mobile)&&(
                  <>
                    <span style={{flex:1,textAlign:"left"}}>{n.label}</span>
                    <span style={{color:"var(--text-3)",display:"flex",transition:"transform .2s",transform:open?"rotate(180deg)":"rotate(0)"}}>
                      <ChevDown/>
                    </span>
                  </>
                )}
              </button>
              {(!collapsed||mobile)&&open&&(
                <div style={{paddingTop:2,paddingBottom:4}}>
                  {n.children.map(c=>(
                    <Link key={c.href} href={c.href}
                      style={subSt(isOn(c.href))}
                      onClick={()=>setMobile(false)}>
                      <span style={{width:4,height:4,borderRadius:"50%",flexShrink:0,background:isOn(c.href)?"#818cf8":"var(--text-3)",transition:"all .15s"}}/>
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="sb-bar" style={{
        display:"none",position:"fixed",top:0,left:0,right:0,height:56,
        zIndex:50,flexDirection:"row",alignItems:"center",
        justifyContent:"space-between",padding:"0 16px",
        borderBottom:"1px solid var(--border-2)",
        ...sidebarStyle, borderRight:"none",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <PvLogo/>
          <span style={{fontSize:14,fontWeight:600,color:"var(--text-1)"}}>PV ERP</span>
        </div>
        <button style={{...R,color:"var(--text-2)"}} onClick={()=>setMobile(true)}><MenuIco/></button>
      </div>

      {/* Backdrop */}
      {mobileOpen&&<div onClick={()=>setMobile(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",zIndex:60}}/>}

      {/* Desktop sidebar */}
      <aside className="sb-desk" style={{
        ...sidebarStyle,
        width:sideW, minWidth:sideW, height:"100vh",
        position:"sticky", top:0, zIndex:40, flexShrink:0,
        display:"flex", flexDirection:"column",
        overflow:"hidden",
        transition:"width .25s ease, min-width .25s ease",
      }}>
        {/* Top glow accent */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:1,
          background:"linear-gradient(90deg,transparent,var(--accent),transparent)",
          pointerEvents:"none",
        }}/>

        {/* Ambient glow orb */}
        <div style={{
          position:"absolute", top:"-30%", left:"50%", transform:"translateX(-50%)",
          width:200, height:200, borderRadius:"50%",
          background:"radial-gradient(circle,var(--accent-dim) 0%,transparent 70%)",
          pointerEvents:"none",
        }}/>

        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center",
          justifyContent:collapsed?"center":"space-between",
          padding:collapsed?"16px 0":"16px 14px",
          borderBottom:"1px solid var(--border)",
          minHeight:60, gap:8, position:"relative",
        }}>
          {collapsed ? (
            <button style={R} onClick={()=>setCollapsed(false)} title="Expand"><PvLogo/></button>
          ) : (
            <>
              <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                <PvLogo/>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:"var(--text-1)",lineHeight:1.2,margin:0}}>PV ERP</p>
                  <p style={{fontSize:9.5,color:"var(--accent)",letterSpacing:"0.1em",textTransform:"uppercase",margin:0}}>Solutions</p>
                </div>
              </div>
              <button onClick={()=>setCollapsed(true)} style={{
                width:26,height:26,borderRadius:7,
                border:"1px solid var(--border)",
                background:"var(--glass-2)",
                color:"var(--text-3)",
                display:"flex",alignItems:"center",justifyContent:"center",
                cursor:"pointer",flexShrink:0,outline:"none",
                transition:"all .15s",
              }}>
                <ChevLeft/>
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"12px 8px",display:"flex",flexDirection:"column",gap:2}}>
          {/* Section label */}
          {!collapsed && (
            <p style={{fontSize:9.5,fontWeight:600,color:"var(--text-3)",letterSpacing:"0.12em",textTransform:"uppercase",padding:"0 4px 6px",margin:"0 0 2px"}}>
              Navigation
            </p>
          )}
          <NavList/>
        </nav>

        {/* Footer */}
        <div style={{padding:"12px 8px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:collapsed?"center":"flex-start"}}>
          {collapsed ? (
            <button onClick={()=>setCollapsed(false)} style={{
              width:32,height:32,borderRadius:8,
              border:"1px solid var(--border)",
              background:"var(--glass-2)",
              color:"var(--text-3)",
              display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",margin:"0 auto",outline:"none",
            }}>
              <ChevRight/>
            </button>
          ) : (
            <div style={{padding:"0 4px"}}>
              <p style={{fontSize:10,color:"var(--text-3)",letterSpacing:"0.05em",margin:0}}>PV ERP v2.0</p>
              <p style={{fontSize:9.5,color:"var(--accent)",margin:0}}>● Secured</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile drawer */}
      <aside className="sb-drawer" style={{
        ...sidebarStyle,
        position:"fixed",top:0,left:0,width:248,height:"100vh",
        display:"flex",flexDirection:"column",
        transform:mobileOpen?"translateX(0)":"translateX(-100%)",
        transition:"transform .25s ease",zIndex:70,overflow:"hidden",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 14px",borderBottom:"1px solid var(--border)",minHeight:60}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <PvLogo/>
            <div>
              <p style={{fontSize:13,fontWeight:700,color:"var(--text-1)",lineHeight:1.2,margin:0}}>PV ERP</p>
              <p style={{fontSize:9.5,color:"var(--accent)",letterSpacing:"0.1em",textTransform:"uppercase",margin:0}}>Solutions</p>
            </div>
          </div>
          <button style={{...R,color:"var(--text-2)"}} onClick={()=>setMobile(false)}><CloseIco/></button>
        </div>
        <nav style={{flex:1,overflowY:"auto",padding:"12px 8px",display:"flex",flexDirection:"column",gap:2}}>
          <NavList mobile/>
        </nav>
      </aside>

      <style>{`
        @media(max-width:768px){.sb-desk{display:none!important}.sb-bar{display:flex!important}}
        @media(min-width:769px){.sb-drawer{display:none!important}.sb-bar{display:none!important}}
        .sb-desk nav a:hover,.sb-desk nav button:hover{background:rgba(255,255,255,0.05)!important;color:var(--text-1)!important;}
      `}</style>
    </>
  );
}