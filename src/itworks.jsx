import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
// ─── Supabase config ─────────────────────────────────────────────────────────
const SB_URL  = "https://qtjlnvubejdasgfaeiic.supabase.co";
const SB_KEY  = "sb_publishable_m_H7ZdvVToxSrNz7et8olw_uQ_404H6";
const SB_HEADERS = {
  "Content-Type": "application/json",
  "apikey": SB_KEY,
  "Authorization": `Bearer ${SB_KEY}`,
  "Prefer": "return=representation",
};

// ─── Supabase helpers ─────────────────────────────────────────────────────────
async function sbLoad() {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/acaddesk?id=eq.main&select=data`, { headers: SB_HEADERS });
    const rows = await r.json();
    if (rows?.[0]?.data?.modules) return rows[0].data;
  } catch(e) { console.warn("Supabase load failed, using local:", e); }
  // Fallback to localStorage if offline
  try { const r = localStorage.getItem("acaddesk_cache"); return r ? JSON.parse(r) : null; } catch { return null; }
}

async function sbSave(data) {
  // Always cache locally for offline resilience
  try { localStorage.setItem("acaddesk_cache", JSON.stringify(data)); } catch {}
  try {
    await fetch(`${SB_URL}/rest/v1/acaddesk?id=eq.main`, {
      method: "PATCH",
      headers: { ...SB_HEADERS, "Prefer": "return=minimal" },
      body: JSON.stringify({ data, updated_at: new Date().toISOString() })
    });
  } catch(e) { console.warn("Supabase save failed:", e); }
}

const STORAGE_KEY = "up_acaddesk_v3"; // kept for extension compat

const PLATFORMS = {
  clickup: { label: "ClickUP", color: "#7C6AF7", bg: "#7C6AF718", icon: "◈", placeholder: "https://clickup.up.ac.za/..." },
  ams:     { label: "AMS",     color: "#F7A84A", bg: "#F7A84A18", icon: "⬡", placeholder: "https://ams.up.ac.za/..."     },
  other:   { label: "Other",   color: "#888",    bg: "#88888818", icon: "◎", placeholder: "https://..."                  },
};

const MODULE_COLORS = ["#7C6AF7","#F76A6A","#4ECDC4","#F7A84A","#A8E063","#F76AD3","#6AABF7"];

const DEFAULT_DATA = {
  todos: [],
  modules: [
    // ── COS 212 — Data Structures & Algorithms ─────────────────────────────
    // Assessments from Gradebook (sync via extension for exact dates/marks)
    { id:"m1", code:"COS212", name:"Data Structures & Algorithms", color:"#7C6AF7", passMark:50,
      assignments:[
        { id:"a1",  name:"Tutorial 1 Test",   weight:3,  mark:null, dueDate:"2026-02-20", link:"https://clickup.up.ac.za/ultra/courses/_186927_1/gradebook", platform:"clickup", notes:"Formative — sync from Gradebook for exact mark", done:false },
        { id:"a2",  name:"Tutorial 2 Test",   weight:3,  mark:null, dueDate:"2026-02-27", link:"https://clickup.up.ac.za/ultra/courses/_186927_1/gradebook", platform:"clickup", notes:"Formative", done:false },
        { id:"a3",  name:"Tutorial 3 Test",   weight:3,  mark:null, dueDate:"2026-03-06", link:"https://clickup.up.ac.za/ultra/courses/_186927_1/gradebook", platform:"clickup", notes:"Formative", done:false },
        { id:"a4",  name:"Practical 1",       weight:10, mark:null, dueDate:"2026-03-07", link:"https://clickup.up.ac.za/ultra/courses/_186927_1/gradebook", platform:"clickup", notes:"Sync from Gradebook for mark", done:false },
        { id:"a5",  name:"Practical 2",       weight:10, mark:null, dueDate:"2026-04-10", link:"https://clickup.up.ac.za/ultra/courses/_186927_1/gradebook", platform:"clickup", notes:"", done:false },
        { id:"a6",  name:"Semester Test 1",   weight:25, mark:null, dueDate:"2026-04-01", link:"https://clickup.up.ac.za/ultra/courses/_186927_1/gradebook", platform:"clickup", notes:"Check ClickUP for exact date", done:false },
        { id:"a7",  name:"Exam",              weight:50, mark:null, dueDate:"2026-06-01", link:"https://clickup.up.ac.za/ultra/courses/_186927_1/gradebook", platform:"clickup", notes:"", done:false },
      ]
    },

    // ── EBN 111 — Electricity & Electronics ────────────────────────────────
    // Final mark: Semester mark 50% + Exam 50%
    // Semester mark: ST1 35% + ST2 35% + Assignments 6% + Class Tests 12% + Practicals 12%
    // As % of FINAL: ST1≈17.5%, ST2≈17.5%, Exam=50%, rest small
    { id:"m2", code:"EBN111", name:"Electricity & Electronics", color:"#F7A84A", passMark:50,
      assignments:[
        { id:"b1",  name:"AMS Assignment 1",    weight:1, mark:null, dueDate:"2026-02-16", link:"https://ams.up.ac.za", platform:"ams", notes:"Ch 1 — Units, Charge, Current, Voltage", done:false },
        { id:"b2",  name:"Pre-Practical 1",     weight:1, mark:null, dueDate:"2026-02-20", link:"https://ams.up.ac.za", platform:"ams", notes:"Submit on AMS before Practical 1", done:false },
        { id:"b3",  name:"AMS Assignment 2",    weight:1, mark:null, dueDate:"2026-02-23", link:"https://ams.up.ac.za", platform:"ams", notes:"Ch 2 — Kirchhoff's Law", done:false },
        { id:"b4",  name:"AMS Assignment 3",    weight:1, mark:null, dueDate:"2026-03-02", link:"https://ams.up.ac.za", platform:"ams", notes:"Ch 3 — Nodal Analysis", done:false },
        { id:"b5",  name:"AMS Assignment 4",    weight:1, mark:null, dueDate:"2026-03-09", link:"https://ams.up.ac.za", platform:"ams", notes:"Ch 3 — Mesh Analysis", done:false },
        { id:"b6",  name:"Class Test 1",        weight:6, mark:null, dueDate:"2026-03-06", link:"https://ams.up.ac.za", platform:"ams", notes:"Chapters 1, 2, 3.2–3.3", done:false },
        { id:"b7",  name:"AMS Assignment 5",    weight:1, mark:null, dueDate:"2026-03-16", link:"https://ams.up.ac.za", platform:"ams", notes:"Ch 4 — Superposition", done:false },
        { id:"b8",  name:"Semester Test 1",     weight:18, mark:null, dueDate:"2026-03-18", link:"https://ams.up.ac.za", platform:"ams", notes:"Week of 16–20 Mar. Chapters 1–3 & 4.2–4.4", done:false },
        { id:"b9",  name:"Practical 1",         weight:2, mark:null, dueDate:"2026-03-06", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Turning on an LED in a resistor network", done:false },
        { id:"b10", name:"AMS Assignment 6",    weight:1, mark:null, dueDate:"2026-03-30", link:"https://ams.up.ac.za", platform:"ams", notes:"Ch 4 — Norton's Theorem", done:false },
        { id:"b11", name:"Pre-Practical 2",     weight:1, mark:null, dueDate:"2026-04-10", link:"https://ams.up.ac.za", platform:"ams", notes:"Submit on AMS before Practical 2", done:false },
        { id:"b12", name:"AMS Assignment 7",    weight:1, mark:null, dueDate:"2026-04-13", link:"https://ams.up.ac.za", platform:"ams", notes:"Ch 5 — Op Amps", done:false },
        { id:"b13", name:"Class Test 2",        weight:6, mark:null, dueDate:"2026-04-28", link:"https://ams.up.ac.za", platform:"ams", notes:"Chapters 4–6", done:false },
        { id:"b14", name:"Pre-Practical 3",     weight:1, mark:null, dueDate:"2026-04-27", link:"https://ams.up.ac.za", platform:"ams", notes:"Submit on AMS before Practical 3", done:false },
        { id:"b15", name:"Practical 2",         weight:2, mark:null, dueDate:"2026-04-10", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Using a transistor as a switch", done:false },
        { id:"b16", name:"AMS Assignment 8",    weight:1, mark:null, dueDate:"2026-04-27", link:"https://ams.up.ac.za", platform:"ams", notes:"", done:false },
        { id:"b17", name:"Semester Test 2",     weight:18, mark:null, dueDate:"2026-05-06", link:"https://ams.up.ac.za", platform:"ams", notes:"Week of 4–8 May. Chapters 4, 5, 6 & 9", done:false },
        { id:"b18", name:"Practical 3",         weight:2, mark:null, dueDate:"2026-05-08", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Using an op-amp to turn on an LED", done:false },
        { id:"b19", name:"AMS Assignment 9",    weight:1, mark:null, dueDate:"2026-05-18", link:"https://ams.up.ac.za", platform:"ams", notes:"", done:false },
        { id:"b20", name:"Exam",                weight:50, mark:null, dueDate:"2026-06-10", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Closed book. Min 40% required to pass", done:false },
      ]
    },

    // ── EJJ 210 — Engineering Communication ────────────────────────────────
    // No exam — semester mark = 100%
    // Tutorials 1-6: 7.5% each = 45%, Tutorials 8&10: 15% each = 30%, Oral: 15%, Homework: 10%
    { id:"m3", code:"EJJ210", name:"Engineering Communication", color:"#4ECDC4", passMark:50,
      assignments:[
        { id:"c1",  name:"Homework 1",        weight:2,  mark:null, dueDate:"2026-02-16", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU1 — Non-session assignment", done:false },
        { id:"c2",  name:"Tutorial 1",        weight:8,  mark:null, dueDate:"2026-02-16", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU1 — Session-based, rubric marked", done:false },
        { id:"c3",  name:"Homework 2",        weight:2,  mark:null, dueDate:"2026-02-23", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU2", done:false },
        { id:"c4",  name:"Tutorial 2",        weight:8,  mark:null, dueDate:"2026-02-23", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU2 — Oral presentation prep", done:false },
        { id:"c5",  name:"Oral Presentation", weight:15, mark:null, dueDate:"2026-03-20", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Slots: 20 Mar or 5 May. Min 40% required", done:false },
        { id:"c6",  name:"Tutorial 3",        weight:8,  mark:null, dueDate:"2026-03-09", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU3", done:false },
        { id:"c7",  name:"Tutorial 4",        weight:8,  mark:null, dueDate:"2026-03-23", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU4", done:false },
        { id:"c8",  name:"Tutorial 5",        weight:8,  mark:null, dueDate:"2026-04-13", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU4", done:false },
        { id:"c9",  name:"Tutorial 6",        weight:8,  mark:null, dueDate:"2026-04-20", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU5", done:false },
        { id:"c10", name:"Tutorial 7",        weight:0,  mark:null, dueDate:"2026-04-27", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU6 — Attendance only, no mark", done:false },
        { id:"c11", name:"Tutorial 8",        weight:15, mark:null, dueDate:"2026-05-04", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU6 — Rubric marked. Min avg 40% for T8&T10", done:false },
        { id:"c12", name:"Tutorial 9",        weight:0,  mark:null, dueDate:"2026-05-11", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU7 — Attendance only", done:false },
        { id:"c13", name:"Tutorial 10",       weight:15, mark:null, dueDate:"2026-05-18", link:"https://clickup.up.ac.za", platform:"clickup", notes:"SU7 — Rubric marked. Min avg 40% for T8&T10", done:false },
      ]
    },

    // ── JCP 203 — Physics (Year module) ────────────────────────────────────
    // Placeholders — no study guide provided yet
    { id:"m4", code:"JCP203", name:"Physics", color:"#F76A6A", passMark:50,
      assignments:[
        { id:"d1", name:"Semester Test 1", weight:25, mark:null, dueDate:"2026-03-20", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Update dates from study guide", done:false },
        { id:"d2", name:"Semester Test 2", weight:25, mark:null, dueDate:"2026-08-01", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Semester 2 — update date", done:false },
        { id:"d3", name:"Exam",            weight:50, mark:null, dueDate:"2026-11-01", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Year module — June or Nov exam", done:false },
      ]
    },

    // ── JSU 110 — (no study guide yet) ─────────────────────────────────────
    { id:"m5", code:"JSU110", name:"JSU 110", color:"#A8E063", passMark:50,
      assignments:[
        { id:"e1", name:"Semester Test 1", weight:30, mark:null, dueDate:"2026-03-20", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Update from study guide", done:false },
        { id:"e2", name:"Semester Test 2", weight:30, mark:null, dueDate:"2026-05-08", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Update from study guide", done:false },
        { id:"e3", name:"Exam",            weight:40, mark:null, dueDate:"2026-06-10", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Update from study guide", done:false },
      ]
    },

    // ── NMC 113 — Materials Science & Engineering ───────────────────────────
    // Final mark: Semester mark 50% + Exam 50%
    // SM breakdown: Semester tests 60% (30% each) + Lab 10% + Class tests 10% + Tutorials 10% + Wiley Plus 10%
    // As % of FINAL: ST1=15%, ST2=15%, Lab=5%, ClassTests=5%, Tutorials=5%, WileyPlus=5%, Exam=50%
    { id:"m6", code:"NMC113", name:"Materials Science & Engineering", color:"#F76AD3", passMark:50,
      assignments:[
        { id:"f1", name:"Wiley Plus (Online)",  weight:5,  mark:null, dueDate:"2026-05-22", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Continuous online assessment — 10% of SM", done:false },
        { id:"f2", name:"Class Test 1",         weight:3,  mark:null, dueDate:"2026-03-13", link:"https://clickup.up.ac.za", platform:"clickup", notes:"During lecture. 10% of SM total for class tests", done:false },
        { id:"f3", name:"Class Test 2",         weight:3,  mark:null, dueDate:"2026-04-24", link:"https://clickup.up.ac.za", platform:"clickup", notes:"During lecture", done:false },
        { id:"f4", name:"Practical 1",          weight:1,  mark:null, dueDate:"2026-03-06", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Lab — Room 4-19 Mineral Sciences. Min 50% avg for all labs", done:false },
        { id:"f5", name:"Practical 2",          weight:1,  mark:null, dueDate:"2026-03-27", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Lab", done:false },
        { id:"f6", name:"Practical 3",          weight:1,  mark:null, dueDate:"2026-04-17", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Lab", done:false },
        { id:"f7", name:"Practical 4",          weight:2,  mark:null, dueDate:"2026-05-08", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Lab — last practical", done:false },
        { id:"f8", name:"Tutorial Classes",     weight:5,  mark:null, dueDate:"2026-05-22", link:"https://clickup.up.ac.za", platform:"clickup", notes:"10% of SM — ongoing throughout semester", done:false },
        { id:"f9", name:"Semester Test 1",      weight:15, mark:null, dueDate:"2026-03-20", link:"https://clickup.up.ac.za", platform:"clickup", notes:"90 min. 30% of SM = 15% of final", done:false },
        { id:"f10",name:"Semester Test 2",      weight:15, mark:null, dueDate:"2026-05-05", link:"https://clickup.up.ac.za", platform:"clickup", notes:"90 min. 30% of SM = 15% of final", done:false },
        { id:"f11",name:"Exam",                 weight:50, mark:null, dueDate:"2026-06-10", link:"https://clickup.up.ac.za", platform:"clickup", notes:"Min 40% exam mark required to pass", done:false },
      ]
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
// loadData — sync fallback only (actual load happens async in useEffect)
const loadData  = () => { try { const r = localStorage.getItem("acaddesk_cache"); return r ? JSON.parse(r) : DEFAULT_DATA; } catch { return DEFAULT_DATA; } };
const saveData  = d  => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }; // kept for extension
const daysUntil = ds => Math.ceil((new Date(ds) - new Date()) / 86400000);
const urgColor  = d  => d < 0 ? "#666" : d <= 3 ? "#F76A6A" : d <= 7 ? "#F7C56A" : "#4ECDC4";
const fmtDate   = ds => new Date(ds).toLocaleDateString("en-ZA", { day:"numeric", month:"short" });

const calcGrade = assignments => {
  let e=0,p=0; assignments.forEach(a=>{ if(a.mark!=null){e+=(a.mark/100)*a.weight;p+=a.weight;} });
  return p===0?null:((e/p)*100).toFixed(1);
};
const calcNeeded = (assignments,target) => {
  let e=0,r=0; assignments.forEach(a=>{ if(a.mark!=null)e+=(a.mark/100)*a.weight; else r+=a.weight; });
  if(r===0)return null; return Math.max(0,((target-e)/r)*100).toFixed(1);
};

// ─── Small components ─────────────────────────────────────────────────────────
const PBadge = ({platform,small})=>{
  const p=PLATFORMS[platform]||PLATFORMS.other;
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:small?"1px 5px":"2px 7px",borderRadius:4,background:p.bg,color:p.color,fontSize:small?9:10,fontWeight:700,letterSpacing:.4,border:`1px solid ${p.color}33`,whiteSpace:"nowrap"}}>{p.icon} {p.label}</span>;
};

const PLink = ({link,platform})=>{
  if(!link)return null;
  const p=PLATFORMS[platform]||PLATFORMS.other;
  return <a href={link} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:7,background:p.bg,color:p.color,fontSize:12,fontWeight:600,textDecoration:"none",border:`1px solid ${p.color}44`}}>Open {p.label} →</a>;
};

const ProgressBar = ({pct,color,height=4})=>(
  <div style={{height,background:"#1e1e22",borderRadius:height}}>
    <div style={{height:"100%",width:`${Math.min(100,Math.max(0,pct))}%`,background:color,borderRadius:height,transition:"width .5s ease"}}/>
  </div>
);

// ─── Filter bar ───────────────────────────────────────────────────────────────
const DEADLINE_OPTS = [{v:"all",l:"All"},{v:"today",l:"Today"},{v:"week",l:"This Week"},{v:"month",l:"This Month"}];
const WEIGHT_OPTS   = [{v:"all",l:"All"},{v:"high",l:"High (≥30%)"},{v:"med",l:"Mid (10-29%)"},{v:"low",l:"Low (<10%)"}];
const PLATFORM_OPTS = [{v:"all",l:"All"},{v:"clickup",l:"ClickUP"},{v:"ams",l:"AMS"},{v:"other",l:"Other"}];

function FilterBar({modules, filters, setFilters, isMobile}){
  const pill = (key,val,label,activeColor="#7C6AF7") => {
    const active = filters[key]===val;
    return <button key={val} onClick={()=>setFilters(f=>({...f,[key]:val}))} style={{padding:isMobile?"5px 10px":"5px 12px",borderRadius:20,fontSize:isMobile?10:11,fontWeight:600,fontFamily:"inherit",border:`1px solid ${active?activeColor:"#2a2a2e"}`,background:active?activeColor+"22":"transparent",color:active?activeColor:"#666",transition:"all .15s",whiteSpace:"nowrap"}}>{label}</button>;
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16,width:"100%",maxWidth:"100%",overflow:"hidden"}}>
      {/* Module filter — horizontal scroll, clipped to viewport */}
      <div className="hide-scroll" style={{display:"flex",gap:6,overflowX:"auto",overflowY:"hidden",paddingBottom:2,width:"100%",WebkitOverflowScrolling:"touch"}}>
        {pill("module","all","All modules")}
        {modules.map(m=>pill("module",m.id,m.code,m.color))}
      </div>
      {/* Deadline + Weight + Platform — scrollable row */}
      <div className="hide-scroll" style={{display:"flex",gap:6,overflowX:"auto",overflowY:"hidden",paddingBottom:2,width:"100%",WebkitOverflowScrolling:"touch"}}>
        {DEADLINE_OPTS.map(o=>pill("deadline",o.v,o.l))}
        <span style={{color:"#2a2a2e",alignSelf:"center",margin:"0 2px",flexShrink:0}}>|</span>
        {WEIGHT_OPTS.map(o=>pill("weight",o.v,o.l))}
        <span style={{color:"#2a2a2e",alignSelf:"center",margin:"0 2px",flexShrink:0}}>|</span>
        {PLATFORM_OPTS.map(o=>pill("platform",o.v,o.l))}
      </div>
    </div>
  );
}

// ─── Assignment card (used in list views) ────────────────────────────────────
function AssignCard({a, mod, onCheck, onEdit, isMobile}){
  const d = daysUntil(a.dueDate);
  return (
    <div style={{padding:isMobile?"12px 14px":"14px 18px",background:a.done?"#111":"#0d0d0f",borderRadius:10,border:`1px solid ${a.done?"#1a1a1c":"#1e1e22"}`,opacity:a.done?.65:1,transition:"opacity .2s"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <input type="checkbox" checked={a.done} onChange={e=>onCheck(e.target.checked)}
          style={{width:15,height:15,accentColor:mod.color,cursor:"pointer",marginTop:3,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:6}}>
            <span style={{fontSize:isMobile?12:13,fontWeight:600,textDecoration:a.done?"line-through":"none",color:a.done?"#555":"#E8E8E6",wordBreak:"break-word"}}>{a.name}</span>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              {a.mark!=null
                ?<span style={{fontSize:14,fontWeight:700,color:a.mark>=50?"#4ECDC4":"#F76A6A"}}>{a.mark}%</span>
                :<span style={{color:"#444",fontSize:12}}>—</span>}
              <button onClick={onEdit} style={{background:"none",color:"#555",fontSize:13,padding:"2px 5px",border:"none",cursor:"pointer"}}>✎</button>
            </div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,alignItems:"center"}}>
            <span style={{display:"inline-block",padding:"2px 7px",borderRadius:20,fontSize:10,border:`1px solid ${mod.color}44`,color:mod.color}}>{a.weight}% wt</span>
            <PBadge platform={a.platform} small={isMobile}/>
            {!a.done&&<span style={{display:"inline-block",padding:"2px 7px",borderRadius:20,fontSize:10,border:`1px solid ${urgColor(d)}44`,color:urgColor(d)}}>{d<0?"Overdue":d===0?"Today!":d===1?"Tomorrow":`${d}d`}</span>}
            <span style={{fontSize:10,color:"#555"}}>{fmtDate(a.dueDate)}</span>
            {a.notes&&!isMobile&&<span style={{fontSize:11,color:"#444",marginLeft:2}}>{a.notes}</span>}
          </div>
          {a.notes&&isMobile&&<div style={{fontSize:11,color:"#444",marginTop:4}}>{a.notes}</div>}
          {a.link&&<div style={{marginTop:8}}><PLink link={a.link} platform={a.platform}/></div>}
        </div>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({onClose,children}){
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div style={{background:"#161618",border:"1px solid #2a2a2e",borderRadius:14,padding:24,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>
        {children}
      </div>
    </div>
  );
}

function AssignForm({title,init,onSave,onClose,onDelete}){
  const [f,setF]=useState({name:"",weight:10,mark:null,dueDate:"",link:"",notes:"",platform:"clickup",...init});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const p=PLATFORMS[f.platform]||PLATFORMS.other;
  return(<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <h3 style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16}}>{title}</h3>
      <button onClick={onClose} style={{background:"none",color:"#666",fontSize:18,padding:"0 4px",border:"none",cursor:"pointer"}}>×</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:11}}>
      <div><label>Name</label><input placeholder="Assignment / Test / Exam" value={f.name||""} onChange={e=>set("name",e.target.value)}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label>Weight %</label><input type="number" min={0} max={100} value={f.weight||""} onChange={e=>set("weight",Number(e.target.value))}/></div>
        <div><label>Mark % (if graded)</label><input type="number" min={0} max={100} placeholder="Leave blank" value={f.mark??""} onChange={e=>set("mark",e.target.value===""?null:Number(e.target.value))}/></div>
      </div>
      <div><label>Due Date</label><input type="date" value={f.dueDate||""} onChange={e=>set("dueDate",e.target.value)}/></div>
      <div>
        <label>Platform</label>
        <div style={{display:"flex",gap:8}}>
          {Object.entries(PLATFORMS).map(([key,val])=>(
            <button key={key} onClick={()=>set("platform",key)} style={{flex:1,padding:"8px 4px",borderRadius:8,fontSize:12,fontFamily:"inherit",fontWeight:600,border:`1px solid ${f.platform===key?val.color:"#2a2a2e"}`,background:f.platform===key?val.bg:"transparent",color:f.platform===key?val.color:"#666",transition:"all .15s",cursor:"pointer"}}>{val.icon} {val.label}</button>
          ))}
        </div>
      </div>
      <div><label>Link ({p.label})</label><input placeholder={p.placeholder} value={f.link||""} onChange={e=>set("link",e.target.value)}/></div>
      <div><label>Notes / Topics to Cover</label><textarea rows={2} placeholder="e.g. Cover chapters 3–6, submit via AMS" value={f.notes||""} onChange={e=>set("notes",e.target.value)} style={{resize:"vertical"}}/></div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
        {onDelete?<button onClick={onDelete} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontFamily:"inherit",background:"transparent",color:"#F76A6A",border:"1px solid #F76A6A33",cursor:"pointer"}}>Delete</button>:<div/>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontFamily:"inherit",background:"transparent",color:"#888",border:"1px solid #2a2a2e",cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>{if(f.name.trim())onSave(f);}} style={{padding:"7px 16px",borderRadius:8,fontSize:12,fontFamily:"inherit",background:"#7C6AF7",color:"white",border:"none",cursor:"pointer",fontWeight:600}}>Save</button>
        </div>
      </div>
    </div>
  </>);
}

function ModuleForm({init,onSave,onClose,colorPool}){
  const [f,setF]=useState({code:"",name:"",color:colorPool[0]||"#7C6AF7",passMark:50,...init});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <h3 style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16}}>{init?.id?"Edit Module":"Add Module"}</h3>
      <button onClick={onClose} style={{background:"none",color:"#666",fontSize:18,padding:"0 4px",border:"none",cursor:"pointer"}}>×</button>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:11}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label>Module Code</label><input placeholder="COS301" value={f.code} onChange={e=>set("code",e.target.value)}/></div>
        <div><label>Pass Mark %</label><input type="number" min={0} max={100} value={f.passMark} onChange={e=>set("passMark",Number(e.target.value))}/></div>
      </div>
      <div><label>Module Name</label><input placeholder="Software Engineering" value={f.name} onChange={e=>set("name",e.target.value)}/></div>
      <div>
        <label>Colour</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}>
          {MODULE_COLORS.map(c=>(
            <div key={c} onClick={()=>set("color",c)} style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",border:f.color===c?"3px solid white":"3px solid transparent",transition:"border .15s"}}/>
          ))}
          <input type="color" value={f.color} onChange={e=>set("color",e.target.value)} style={{width:28,height:28,padding:2,borderRadius:"50%",border:"none",background:"none",cursor:"pointer"}} title="Custom"/>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:6}}>
        <button onClick={onClose} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontFamily:"inherit",background:"transparent",color:"#888",border:"1px solid #2a2a2e",cursor:"pointer"}}>Cancel</button>
        <button onClick={()=>{if(f.code.trim()&&f.name.trim())onSave(f);}} style={{padding:"7px 16px",borderRadius:8,fontSize:12,fontFamily:"inherit",background:"#7C6AF7",color:"white",border:"none",cursor:"pointer",fontWeight:600}}>Save</button>
      </div>
    </div>
  </>);
}

// ─── Apply filters ────────────────────────────────────────────────────────────
function applyFilters(assignments, filters) {
  return assignments.filter(a => {
    if (filters.module !== "all" && a._moduleId !== filters.module) return false;
    if (filters.platform !== "all" && a.platform !== filters.platform) return false;
    if (filters.weight !== "all") {
      if (filters.weight === "high" && a.weight < 30) return false;
      if (filters.weight === "med"  && (a.weight < 10 || a.weight >= 30)) return false;
      if (filters.weight === "low"  && a.weight >= 10) return false;
    }
    if (filters.deadline !== "all") {
      const d = daysUntil(a.dueDate);
      if (filters.deadline === "today" && d !== 0) return false;
      if (filters.deadline === "week"  && (d < 0 || d > 7)) return false;
      if (filters.deadline === "month" && (d < 0 || d > 31)) return false;
    }
    return true;
  });
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [data,    setData]    = useState(loadData);
  const [view,    setView]    = useState("dashboard");
  const [activeM, setActiveM] = useState(null);
  const [modal,   setModal]   = useState(null);
  const [target,  setTarget]  = useState(50);
  const [filters, setFilters] = useState({ module:"all", deadline:"all", weight:"all", platform:"all" });
  const [navOpen, setNavOpen] = useState(false);

  // Responsive breakpoint
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ── Supabase: initial load ────────────────────────────────────────────────
  const [syncStatus, setSyncStatus] = useState("loading"); // "loading"|"live"|"offline"
  const saveTimer   = useRef(null);
  const isRemote    = useRef(false); // flag to skip save when change came from remote

  useEffect(() => {
    sbLoad().then(remote => {
      if (remote?.modules) {
        setData(remote);
        setSyncStatus("live");
      } else {
        setSyncStatus("offline");
      }
    });
  }, []);

  // ── Supabase: save on every data change (debounced 800ms) ────────────────
  useEffect(() => {
    if (isRemote.current) { isRemote.current = false; return; }
    // Also write to localStorage so extension can still read it
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      sbSave(data).then(() => setSyncStatus("live")).catch(() => setSyncStatus("offline"));
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [data]);

  // ── Supabase: realtime subscription (long-poll every 5s) ─────────────────
  // Supabase realtime requires the client library; we use a lightweight polling approach instead
  useEffect(() => {
    let interval = setInterval(async () => {
      try {
        const r = await fetch(
          `${SB_URL}/rest/v1/acaddesk?id=eq.main&select=data,updated_at`,
          { headers: SB_HEADERS }
        );
        const rows = await r.json();
        const remote = rows?.[0];
        if (!remote?.data?.modules) return;
        // Only update if remote is newer than our last save
        const remoteTime = new Date(remote.updated_at).getTime();
        const localTime  = new Date(window._lastSave || 0).getTime();
        if (remoteTime > localTime + 1000) {
          isRemote.current = true;
          setData(remote.data);
          setSyncStatus("live");
        }
      } catch { setSyncStatus("offline"); }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Track our own save time so we don't loop
  useEffect(() => { window._lastSave = new Date().toISOString(); }, [data]);

  // ── Extension writes (localStorage) ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const incoming = JSON.parse(e.newValue);
          if (incoming?.modules) { setData(incoming); sbSave(incoming); }
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // ── Data mutations ──────────────────────────────────────────────────────────
  const upsertAssign = useCallback((moduleId, assign) => {
    setData(d => ({...d, modules: d.modules.map(m => m.id !== moduleId ? m : {
      ...m, assignments: m.assignments.find(a=>a.id===assign.id)
        ? m.assignments.map(a=>a.id===assign.id?{...a,...assign}:a)
        : [...m.assignments, {id:"a"+Date.now(), done:false, mark:null, ...assign}]
    })}));
  }, []);

  const deleteAssign = useCallback((moduleId, assignId) => {
    setData(d => ({...d, modules: d.modules.map(m => m.id !== moduleId ? m : {...m, assignments: m.assignments.filter(a=>a.id!==assignId)})}));
    setModal(null);
  }, []);

  const upsertModule = useCallback((mod) => {
    setData(d => ({...d, modules: d.modules.find(m=>m.id===mod.id)
      ? d.modules.map(m=>m.id===mod.id?{...m,...mod}:m)
      : [...d.modules, {id:"m"+Date.now(), assignments:[], ...mod}]
    }));
    setModal(null);
  }, []);

  const deleteModule = useCallback((id) => {
    setData(d => ({...d, modules: d.modules.filter(m=>m.id!==id)}));
    setActiveM(null); setView("dashboard"); setModal(null);
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  const flatAssignments = useMemo(() =>
    data.modules.flatMap(m => m.assignments.map(a => ({...a, _moduleId:m.id, _moduleCode:m.code, _moduleColor:m.color, _moduleName:m.name}))),
  [data]);

  const upcomingAll = useMemo(() =>
    flatAssignments.filter(a=>!a.done).sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)),
  [flatAssignments]);

  const filteredUpcoming = useMemo(() => applyFilters(upcomingAll, filters), [upcomingAll, filters]);

  const mod = useMemo(() => activeM ? data.modules.find(m=>m.id===activeM) : null, [data, activeM]);

  const colorPool = useMemo(() => {
    const used = data.modules.map(m=>m.color);
    return MODULE_COLORS.filter(c=>!used.includes(c));
  }, [data]);

  // ── Today's tasks ──────────────────────────────────────────────────────────
  // Survival logic: runs once on mount
  // A task is kept if: created today OR ever checked off. Otherwise deleted after 1 day.
  useEffect(() => {
    const today = new Date().toISOString().slice(0,10);
    setData(d => ({
      ...d,
      todos: (d.todos||[]).filter(t => {
        const createdDay = (t.createdAt||"").slice(0,10);
        const isToday    = createdDay === today;
        const everDone   = !!t.everDone; // set true when first checked
        const dayOld     = createdDay < today;
        // Keep if: created today, or ever worked on (checked at any point)
        // Remove if: never touched AND at least 1 day old
        if (isToday) return true;
        if (everDone) return true;
        if (dayOld && !everDone) return false;
        return true;
      })
    }));
  }, []); // eslint-disable-line

  const addTodo = useCallback((text, moduleId) => {
    if (!text.trim()) return;
    setData(d => ({...d, todos: [...(d.todos||[]), {
      id: "t"+Date.now(),
      text: text.trim(),
      done: false,
      everDone: false,
      moduleId: moduleId || null,
      createdAt: new Date().toISOString(),
    }]}));
  }, []);

  const toggleTodo = useCallback((id) => {
    setData(d => ({...d, todos: (d.todos||[]).map(t =>
      t.id===id ? {...t, done:!t.done, everDone: t.everDone || !t.done} : t
    )}));
  }, []);

  const deleteTodo = useCallback((id) => {
    setData(d => ({...d, todos: (d.todos||[]).filter(t => t.id!==id)}));
  }, []);

  // ── Nav helper ──────────────────────────────────────────────────────────────
  const goTo = (v) => { setView(v); setActiveM(null); setNavOpen(false); };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const s = {
    page:    { fontFamily:"'DM Mono','Fira Code',monospace", background:"#0A0A0C", color:"#E0E0DE", overflowX:"hidden", width:"100%", maxWidth:"100vw" },
    header:  { borderBottom:"1px solid #1c1c20", padding: isMobile ? "0 14px" : "0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:52, position:"sticky", top:0, background:"#0A0A0C", zIndex:100, width:"100%", maxWidth:"100vw", boxSizing:"border-box" },
    content: { padding: isMobile ? "14px 12px 100px" : "28px 40px 48px", width:"100%", maxWidth:"100vw", overflowX:"hidden", boxSizing:"border-box" },
    card:    { background:"#131315", border:"1px solid #1e1e22", borderRadius:12, padding: isMobile ? 14 : 22 },
    sectionLabel: { fontSize:10, color:"#555", letterSpacing:1.2, marginBottom:12, fontWeight:600 },
    btn:     (bg,col,border) => ({ padding:"8px 16px", borderRadius:8, fontSize:12, fontFamily:"inherit", background:bg, color:col, border:`1px solid ${border}`, cursor:"pointer", fontWeight:600, transition:"all .15s" }),
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { overflow-x: hidden; overflow-y: auto; max-width: 100vw; height: 100%; background: #0A0A0C; }
        body { overflow-x: hidden; overflow-y: auto; width: 100%; max-width: 100vw; height: auto; min-height: 100%; background: #0A0A0C; margin: 0; }
        #root { min-height: 100dvh; height: auto; width: 100vw; max-width: 100vw; overflow-x: hidden; background: #0A0A0C; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #2a2a2e; border-radius: 2px; }
        input, textarea, select { background: #1a1a1e; border: 1px solid #2a2a2e; color: #E0E0DE; padding: 8px 11px; border-radius: 7px; font-family: inherit; font-size: 13px; outline: none; width: 100%; transition: border .15s; }
        input:focus, textarea:focus { border-color: #7C6AF7; }
        input[type=checkbox] { width: auto; }
        label { font-size: 11px; color: #666; display: block; margin-bottom: 4px; }
        textarea { resize: vertical; }
        button:active { opacity: .8; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        @media (hover: hover) { .mod-card:hover { border-color: var(--mc) !important; } .upcoming-row:hover { border-color: var(--mc) !important; } }
      `}</style>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,#7C6AF7,#F7A84A)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"white",fontFamily:"Syne,sans-serif",flexShrink:0}}>UP</div>
          <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:14,letterSpacing:.3}}>AcadDesk</span>
          <span title={syncStatus==="live"?"Synced":syncStatus==="loading"?"Connecting...":"Offline — changes saved locally"} style={{
            width:7, height:7, borderRadius:"50%", flexShrink:0,
            background: syncStatus==="live"?"#4ECDC4": syncStatus==="loading"?"#F7A84A":"#F76A6A",
            boxShadow: syncStatus==="live"?"0 0 6px #4ECDC4":"none",
            transition:"background .5s"
          }}/>
          {activeM && mod && !isMobile && <>
            <span style={{color:"#333",margin:"0 4px"}}>/</span>
            <span style={{fontSize:12,color:mod.color,fontWeight:600}}>{mod.code}</span>
          </>}
        </div>
        {isMobile ? (
  <div/>
        ) : (
          <div style={{display:"flex",gap:2}}>
            {[["dashboard","Dashboard"],["calendar","Timeline"],["grades","Grades"]].map(([v,l])=>(
              <button key={v} onClick={()=>goTo(v)} style={{padding:"6px 13px",borderRadius:8,fontSize:12,fontFamily:"inherit",background:view===v?"#1e1e22":"transparent",color:view===v?"#E0E0DE":"#666",border:"none",cursor:"pointer",transition:"all .15s"}}>{l}</button>
            ))}
          </div>
        )}
      </div>



      <div style={s.content}>

        {/* ════ DASHBOARD ════ */}
        {view==="dashboard" && !activeM && (<>
          <div style={{marginBottom:22}}>
            <h1 style={{fontFamily:"Syne,sans-serif",fontSize:isMobile?18:22,fontWeight:800,marginBottom:4}}>
              Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"} 👋
            </h1>
            <p style={{color:"#555",fontSize:12}}>{data.modules.length} modules · {upcomingAll.length} pending tasks</p>
          </div>

          {/* Filter bar */}
          <FilterBar modules={data.modules} filters={filters} setFilters={setFilters} isMobile={isMobile}/>

          {/* Today's Tasks */}
          <TodayTasks todos={data.todos||[]} modules={data.modules} onAdd={addTodo} onToggle={toggleTodo} onDelete={deleteTodo} isMobile={isMobile} card={s.card} sectionLabel={s.sectionLabel}/>

          {/* Responsive layout — single col mobile, two col desktop */}
          <div style={isMobile ? {display:"flex",flexDirection:"column",gap:16,width:"100%"} : {display:"grid",gridTemplateColumns:"380px 1fr",gap:24,alignItems:"start",width:"100%"}}>

          {/* LEFT col: Upcoming deadlines */}
          <div style={{...s.card, minWidth:0, width:"100%", overflow:"hidden"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <p style={s.sectionLabel}>UPCOMING DEADLINES {filteredUpcoming.length!==upcomingAll.length&&`(${filteredUpcoming.length}/${upcomingAll.length})`}</p>
              {filters.module!=="all"||filters.deadline!=="all"||filters.weight!=="all"||filters.platform!=="all"
                ?<button onClick={()=>setFilters({module:"all",deadline:"all",weight:"all",platform:"all"})} style={{...s.btn("transparent","#F76A6A","#F76A6A33"),fontSize:10,padding:"3px 9px"}}>Clear ×</button>
                :null}
            </div>
            {filteredUpcoming.length===0 && <p style={{color:"#444",fontSize:13,padding:"8px 0"}}>No tasks match these filters 🎉</p>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filteredUpcoming.map(a => {
                const m = data.modules.find(m=>m.id===a._moduleId);
                if(!m) return null;
                return (
                  <div key={a.id} className="upcoming-row" style={{"--mc":m.color,cursor:"pointer",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#0A0A0C",borderRadius:9,border:"1px solid #1c1c20",transition:"border-color .15s"}}
                    onClick={()=>setActiveM(m.id)}>
                    <div style={{width:3,height:36,borderRadius:2,background:m.color,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:10,color:m.color,fontWeight:600}}>{m.code}</span>
                        <span style={{color:"#2a2a2e"}}>·</span>
                        <span style={{fontSize:10,color:"#555"}}>{a.weight}% wt</span>
                        <PBadge platform={a.platform} small/>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      {(()=>{const d=daysUntil(a.dueDate);return(<>
                        <div style={{fontSize:11,color:urgColor(d),fontWeight:600}}>{d<0?"Overdue":d===0?"Today!":d===1?"Tomorrow":`${d}d`}</div>
                        <div style={{fontSize:10,color:"#444"}}>{fmtDate(a.dueDate)}</div>
                      </>);})()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Module cards */}
          <div style={{minWidth:0, width:"100%"}}>
          <p style={{...s.sectionLabel, marginBottom:12}}>MODULES</p>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:12,width:"100%"}}>
            {data.modules.map(m=>{
              const grade   = calcGrade(m.assignments);
              const pending = m.assignments.filter(a=>!a.done).length;
              const assessed= m.assignments.reduce((s,a)=>s+(a.mark!=null?a.weight:0),0);
              const total   = m.assignments.reduce((s,a)=>s+a.weight,0);
              const hasAms  = m.assignments.some(a=>a.platform==="ams");
              return (
                <div key={m.id} className="mod-card" style={{"--mc":m.color,...s.card,cursor:"pointer",transition:"border-color .15s"}}
                  onClick={()=>setActiveM(m.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,flexWrap:"wrap"}}>
                        <span style={{fontSize:10,color:m.color,fontWeight:700,letterSpacing:1}}>{m.code}</span>
                        {hasAms&&<PBadge platform="ams" small/>}
                      </div>
                      <div style={{fontSize:14,fontFamily:"Syne,sans-serif",fontWeight:700,lineHeight:1.3}}>{m.name}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                      <div style={{fontSize:20,fontWeight:700,fontFamily:"Syne,sans-serif",color:grade?(parseFloat(grade)>=m.passMark?"#4ECDC4":"#F76A6A"):"#444"}}>{grade?`${grade}%`:"—"}</div>
                      <div style={{fontSize:9,color:"#444"}}>current</div>
                    </div>
                  </div>
                  <ProgressBar pct={total>0?(assessed/total)*100:0} color={m.color}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#555",marginTop:8}}>
                    <span>{pending} pending</span>
                    <span>{assessed}/{total}% assessed</span>
                  </div>
                </div>
              );
            })}
            {/* Add module card */}
            <div style={{...s.card,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:"#444",fontSize:13,border:"1px dashed #2a2a2e",minHeight:80,transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#555";e.currentTarget.style.color="#888";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#2a2a2e";e.currentTarget.style.color="#444";}}
              onClick={()=>setModal({type:"add-module"})}>
              <span style={{fontSize:20}}>+</span> Add Module
            </div>
          </div>
          </div>{/* end right column */}
          </div>{/* end two-column grid */}
        </>)}

        {/* ════ MODULE DETAIL ════ */}
        {view==="dashboard" && activeM && mod && (<>
          {!isMobile&&(
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <button onClick={()=>setActiveM(null)} style={{...s.btn("transparent","#888","#2a2a2e"),padding:"5px 11px"}}>← Back</button>
              <div style={{width:7,height:7,borderRadius:"50%",background:mod.color}}/>
              <span style={{fontSize:10,color:mod.color,fontWeight:700,letterSpacing:1}}>{mod.code}</span>
              <span style={{fontSize:14,fontFamily:"Syne,sans-serif",fontWeight:700}}>{mod.name}</span>
              <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                <button onClick={()=>setModal({type:"edit-module",mod})} style={{...s.btn("transparent","#888","#2a2a2e"),padding:"5px 11px"}}>Edit Module</button>
                <button onClick={()=>setModal({type:"confirm-delete-module",id:mod.id})} style={{...s.btn("transparent","#F76A6A","#F76A6A33"),padding:"5px 11px"}}>Delete</button>
              </div>
            </div>
          )}
          {isMobile&&(
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <button onClick={()=>setActiveM(null)} style={{...s.btn("transparent","#888","#2a2a2e"),padding:"5px 10px",fontSize:11}}>← Back</button>
              <span style={{fontSize:10,color:mod.color,fontWeight:700}}>{mod.code}</span>
              <span style={{fontSize:13,fontFamily:"Syne,sans-serif",fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{mod.name}</span>
            </div>
          )}

          {/* Daily tasks for this module */}
          <ModuleTodayTasks
            todos={(data.todos||[]).filter(t=>t.moduleId===mod.id)}
            mod={mod}
            onAdd={(text)=>addTodo(text, mod.id)}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            isMobile={isMobile}
            card={s.card}
            sectionLabel={s.sectionLabel}
          />

          {/* Grade summary */}
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:18}}>
            {[50,60,75].map(t=>{
              const needed=calcNeeded(mod.assignments,t);
              const grade=calcGrade(mod.assignments);
              const done=grade&&parseFloat(grade)>=t;
              return(
                <div key={t} style={{...s.card,textAlign:"center",cursor:"pointer",borderColor:target===t?mod.color:"#1e1e22",transition:"border-color .15s"}} onClick={()=>setTarget(t)}>
                  <div style={{fontSize:10,color:"#555",marginBottom:5}}>For {t}%</div>
                  <div style={{fontSize:18,fontWeight:800,fontFamily:"Syne,sans-serif",color:done?"#4ECDC4":needed===null?"#444":parseFloat(needed)>100?"#F76A6A":"#E0E0DE"}}>
                    {done?"✓":needed===null?"—":parseFloat(needed)>100?"✗":`${needed}%`}
                  </div>
                  <div style={{fontSize:9,color:"#444"}}>{done?"achieved":needed===null?"no data":parseFloat(needed)>100?"impossible":"avg needed"}</div>
                </div>
              );
            })}
            <div style={{...s.card,textAlign:"center"}}>
              <div style={{fontSize:10,color:"#555",marginBottom:5}}>Current</div>
              <div style={{fontSize:18,fontWeight:800,fontFamily:"Syne,sans-serif",color:mod.color}}>{calcGrade(mod.assignments)||"—"}%</div>
              <div style={{fontSize:9,color:"#444"}}>of assessed</div>
            </div>
          </div>

          {/* Assignments */}
          <div style={s.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <p style={s.sectionLabel}>ASSESSMENTS ({mod.assignments.length})</p>
              <button onClick={()=>setModal({type:"add-assign",moduleId:mod.id})} style={{...s.btn("#7C6AF7","white","#7C6AF7"),padding:"5px 12px",fontSize:11}}>+ Add</button>
            </div>
            {mod.assignments.length===0&&<p style={{color:"#444",fontSize:13}}>No assessments yet. Add one above.</p>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[...mod.assignments].sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).map(a=>(
                <AssignCard key={a.id} a={a} mod={mod} isMobile={isMobile}
                  onCheck={v=>upsertAssign(mod.id,{...a,done:v})}
                  onEdit={()=>setModal({type:"edit-assign",moduleId:mod.id,assign:a})}/>
              ))}
            </div>
          </div>
          {isMobile&&(
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={()=>setModal({type:"edit-module",mod})} style={{...s.btn("transparent","#888","#2a2a2e"),flex:1}}>Edit Module</button>
              <button onClick={()=>setModal({type:"confirm-delete-module",id:mod.id})} style={{...s.btn("transparent","#F76A6A","#F76A6A33"),flex:1}}>Delete Module</button>
            </div>
          )}
        </>)}

        {/* ════ TIMELINE ════ */}
        {view==="calendar" && (<>
          <h2 style={{fontFamily:"Syne,sans-serif",fontSize:isMobile?17:20,fontWeight:800,marginBottom:14}}>Deadline Timeline</h2>
          <FilterBar modules={data.modules} filters={filters} setFilters={setFilters} isMobile={isMobile}/>
          {(()=>{
            const all = applyFilters(flatAssignments.sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)), {...filters,module:filters.module});
            if(all.length===0)return<p style={{color:"#444",fontSize:13}}>No tasks match these filters.</p>;
            return all.map(a=>{
              const m=data.modules.find(m=>m.id===a._moduleId); if(!m)return null;
              const d=daysUntil(a.dueDate);
              return(
                <div key={a.id} style={{display:"flex",gap:isMobile?10:16,marginBottom:6}}>
                  <div style={{width:isMobile?56:76,textAlign:"right",paddingTop:10,flexShrink:0}}>
                    <div style={{fontSize:11,color:urgColor(d),fontWeight:600}}>{d<0?"Over":d===0?"Today":d===1?"Tmrw":`${d}d`}</div>
                    <div style={{fontSize:9,color:"#444"}}>{fmtDate(a.dueDate)}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:a.done?"#2a2a2e":m.color,marginTop:11,flexShrink:0}}/>
                    <div style={{width:1,flex:1,background:"#1e1e22",minHeight:10}}/>
                  </div>
                  <div style={{...s.card,flex:1,padding:isMobile?"10px 12px":"11px 16px",opacity:a.done?.5:1,borderLeft:`3px solid ${m.color}`,marginBottom:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:6}}>
                      <div style={{flex:1,minWidth:0}}>
                        <span style={{fontSize:10,color:m.color,fontWeight:700}}>{m.code}</span>
                        <span style={{fontSize:isMobile?12:13,fontWeight:500,marginLeft:8,wordBreak:"break-word"}}>{a.name}</span>
                      </div>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",flexShrink:0}}>
                        <span style={{fontSize:10,padding:"1px 6px",borderRadius:10,border:"1px solid #2a2a2e",color:"#888"}}>{a.weight}%</span>
                        <PBadge platform={a.platform} small/>
                        {a.done&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:10,border:"1px solid #4ECDC433",color:"#4ECDC4"}}>done</span>}
                        {a.link&&!isMobile&&<PLink link={a.link} platform={a.platform}/>}
                      </div>
                    </div>
                    {a.link&&isMobile&&<div style={{marginTop:8}}><PLink link={a.link} platform={a.platform}/></div>}
                  </div>
                </div>
              );
            });
          })()}
        </>)}

        {/* ════ GRADES ════ */}
        {view==="grades" && (<>
          <h2 style={{fontFamily:"Syne,sans-serif",fontSize:isMobile?17:20,fontWeight:800,marginBottom:6}}>Grade Calculator</h2>
          <p style={{color:"#555",fontSize:12,marginBottom:18}}>What avg do you need on remaining work to hit your target?</p>
          <div style={{display:"flex",gap:8,marginBottom:22,flexWrap:"wrap",alignItems:"center"}}>
            {[50,60,75].map(t=><button key={t} onClick={()=>setTarget(t)} style={{...s.btn(target===t?"#7C6AF7":"transparent",target===t?"white":"#888",target===t?"#7C6AF7":"#2a2a2e")}}>{t}%</button>)}
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:11,color:"#555"}}>Custom:</span>
              <input type="number" min={0} max={100} value={target} onChange={e=>setTarget(Number(e.target.value))} style={{width:60}}/>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {data.modules.map(m=>{
              const grade=calcGrade(m.assignments);
              const needed=calcNeeded(m.assignments,target);
              const total=m.assignments.reduce((s,a)=>s+a.weight,0);
              const assessed=m.assignments.filter(a=>a.mark!=null).reduce((s,a)=>s+a.weight,0);
              const already=grade&&parseFloat(grade)>=target;
              return(
                <div key={m.id} style={{...s.card,borderLeft:`4px solid ${m.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                        <span style={{fontSize:10,color:m.color,fontWeight:700,letterSpacing:.8}}>{m.code}</span>
                        {m.assignments.some(a=>a.platform==="ams")&&<PBadge platform="ams" small/>}
                      </div>
                      <div style={{fontSize:isMobile?13:15,fontFamily:"Syne,sans-serif",fontWeight:700}}>{m.name}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:isMobile?20:24,fontFamily:"Syne,sans-serif",fontWeight:800,color:already?"#4ECDC4":needed&&parseFloat(needed)>100?"#F76A6A":"#E0E0DE"}}>
                        {already?"✓":needed===null?"—":parseFloat(needed)>100?"✗":`${needed}%`}
                      </div>
                      <div style={{fontSize:10,color:"#555"}}>{already?"target reached!":needed===null?"no marks yet":parseFloat(needed)>100?"not achievable":"avg needed"}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                    {[["Current",grade?`${grade}%`:"—",grade?(parseFloat(grade)>=m.passMark?"#4ECDC4":"#F76A6A"):"#444"],
                      ["Assessed",`${assessed}/${total}%`,"#E0E0DE"],
                      ["Pass",`${m.passMark}%`,"#E0E0DE"]].map(([l,v,c])=>(
                      <div key={l} style={{background:"#0d0d0f",borderRadius:8,padding:"9px 11px"}}>
                        <div style={{fontSize:10,color:"#555",marginBottom:3}}>{l}</div>
                        <div style={{fontSize:15,fontWeight:700,color:c}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:10,color:"#555",marginBottom:8,letterSpacing:.8}}>BREAKDOWN</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {m.assignments.map(a=>(
                      <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:11}}>
                        <div style={{width:isMobile?70:90,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}}>{a.name}</div>
                        <ProgressBar pct={a.mark??0} color={a.mark!=null?(a.mark>=50?"#4ECDC4":"#F76A6A"):"#1e1e22"}/>
                        <div style={{width:32,textAlign:"right",color:a.mark!=null?"#E0E0DE":"#444",flexShrink:0}}>{a.mark!=null?`${a.mark}%`:"—"}</div>
                        <div style={{width:26,color:m.color,textAlign:"right",flexShrink:0}}>{a.weight}%</div>
                        {!isMobile&&<PBadge platform={a.platform} small/>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>)}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <div style={{position:"fixed",bottom:0,left:0,right:0,width:"100%",background:"#0F0F12",borderTop:"1px solid #1c1c20",display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
          {[["dashboard","⊞","Home"],["calendar","◷","Timeline"],["grades","◎","Grades"]].map(([v,icon,l])=>(
            <button key={v} onClick={()=>goTo(v)} style={{flex:1,padding:"10px 0 12px",background:"none",border:"none",cursor:"pointer",color:view===v?"#7C6AF7":"#555",fontSize:9,fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:18,lineHeight:1}}>{icon}</span>{l}
            </button>
          ))}
        </div>
      )}

      {/* ════ MODALS ════ */}
      {modal && (
        <Modal onClose={()=>setModal(null)}>
          {modal.type==="add-module" && <ModuleForm colorPool={colorPool} onSave={m=>upsertModule(m)} onClose={()=>setModal(null)}/>}
          {modal.type==="edit-module" && <ModuleForm init={modal.mod} colorPool={colorPool} onSave={m=>upsertModule(m)} onClose={()=>setModal(null)}/>}

          {modal.type==="confirm-delete-module" && (<>
            <h3 style={{fontFamily:"Syne,sans-serif",fontWeight:700,marginBottom:10}}>Delete Module?</h3>
            <p style={{color:"#888",fontSize:13,marginBottom:20}}>This will permanently delete the module and all its assessments.</p>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setModal(null)} style={{...s.btn("transparent","#888","#2a2a2e")}}>Cancel</button>
              <button onClick={()=>deleteModule(modal.id)} style={{...s.btn("transparent","#F76A6A","#F76A6A33")}}>Delete</button>
            </div>
          </>)}

          {modal.type==="add-assign" && (
            <AssignForm title="Add Assessment" init={{}} onSave={f=>{upsertAssign(modal.moduleId,f);setModal(null);}} onClose={()=>setModal(null)}/>
          )}
          {modal.type==="edit-assign" && (
            <AssignForm title="Edit Assessment" init={modal.assign}
              onSave={f=>{upsertAssign(modal.moduleId,{...modal.assign,...f});setModal(null);}}
              onClose={()=>setModal(null)}
              onDelete={()=>deleteAssign(modal.moduleId,modal.assign.id)}/>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── Today's Tasks component ─────────────────────────────────────────────────
function TodayTasks({ todos, modules, onAdd, onToggle, onDelete, isMobile, card, sectionLabel }) {
  const [input, setInput]       = useState("");
  const [moduleId, setModuleId] = useState("none");
  const [showDone, setShowDone] = useState(false);

  const pending   = todos.filter(t => !t.done);
  const completed = todos.filter(t => t.done);

  const getModule = (id) => modules.find(m => m.id === id) || null;

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input, moduleId === "none" ? null : moduleId);
    setInput("");
    setModuleId("none");
  };

  const today = new Date().toISOString().slice(0,10);
  const isNew  = (t) => (t.createdAt||"").slice(0,10) === today;

  return (
    <div style={{...card, marginBottom:20, width:"100%"}}>

      {/* Header */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <p style={{...sectionLabel, marginBottom:0}}>TODAY'S TASKS</p>
          {pending.length > 0 && (
            <span style={{background:"#7C6AF722", color:"#7C6AF7", fontSize:10, fontWeight:700,
              padding:"1px 7px", borderRadius:10, border:"1px solid #7C6AF733"}}>
              {pending.length}
            </span>
          )}
        </div>
        {completed.length > 0 && (
          <button onClick={() => setShowDone(s=>!s)}
            style={{background:"none", border:"none", color:"#555", fontSize:10, cursor:"pointer",
              fontFamily:"inherit", padding:0}}>
            {showDone ? "hide" : `${completed.length} done ↓`}
          </button>
        )}
      </div>

      {/* Add task row */}
      <div style={{display:"flex", gap:8, marginBottom: todos.length > 0 ? 14 : 0,
        flexDirection: isMobile ? "column" : "row"}}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Add a task for today... (Enter to add)"
          style={{flex:1, background:"#0d0d0f", border:"1px solid #2a2a2e", color:"#E0E0DE",
            padding:"9px 12px", borderRadius:8, fontFamily:"inherit", fontSize:12,
            outline:"none", width: isMobile ? "100%" : "auto"}}
        />
        {/* Module picker */}
        <select
          value={moduleId}
          onChange={e => setModuleId(e.target.value)}
          style={{background:"#0d0d0f", border:"1px solid #2a2a2e", color: moduleId==="none" ? "#555" : "#E0E0DE",
            padding:"9px 10px", borderRadius:8, fontFamily:"inherit", fontSize:12,
            outline:"none", cursor:"pointer", width: isMobile ? "100%" : "auto",
            minWidth:120, flexShrink:0}}>
          <option value="none">Personal</option>
          {modules.map(m => (
            <option key={m.id} value={m.id}>{m.code}</option>
          ))}
        </select>
        <button onClick={handleAdd}
          style={{padding:"9px 16px", borderRadius:8, background:"#7C6AF722", color:"#7C6AF7",
            border:"1px solid #7C6AF733", fontFamily:"inherit", fontSize:12, fontWeight:600,
            cursor:"pointer", whiteSpace:"nowrap", flexShrink:0}}>
          + Add
        </button>
      </div>

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div style={{display:"flex", flexDirection:"column", gap:6,
          marginBottom: completed.length > 0 && showDone ? 12 : 0}}>
          {pending.map(t => {
            const mod   = getModule(t.moduleId);
            const color = mod ? mod.color : "#555";
            return (
              <div key={t.id} style={{display:"flex", alignItems:"center", gap:10,
                padding:"9px 12px", background:"#0d0d0f", borderRadius:8,
                border:`1px solid ${mod ? color+"33" : "#1e1e22"}`,
                borderLeft: mod ? `3px solid ${color}` : "1px solid #1e1e22"}}>
                <input type="checkbox" checked={false} onChange={() => onToggle(t.id)}
                  style={{width:15, height:15, accentColor: mod ? color : "#7C6AF7",
                    cursor:"pointer", flexShrink:0}}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13, color:"#E0E0DE", overflow:"hidden",
                    textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{t.text}</div>
                  <div style={{display:"flex", alignItems:"center", gap:6, marginTop:2}}>
                    {mod
                      ? <span style={{fontSize:10, color:color, fontWeight:600}}>{mod.code}</span>
                      : <span style={{fontSize:10, color:"#444"}}>Personal</span>
                    }
                    {!isNew(t) && (
                      <span style={{fontSize:9, color:"#F7A84A", background:"#F7A84A11",
                        padding:"1px 5px", borderRadius:4, border:"1px solid #F7A84A22"}}>
                        carried over
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => onDelete(t.id)}
                  style={{background:"none", border:"none", color:"#333", fontSize:16,
                    cursor:"pointer", padding:"0 2px", lineHeight:1, flexShrink:0}}
                  onMouseEnter={e => e.currentTarget.style.color="#F76A6A"}
                  onMouseLeave={e => e.currentTarget.style.color="#333"}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed tasks — collapsible */}
      {completed.length > 0 && showDone && (
        <div style={{display:"flex", flexDirection:"column", gap:5}}>
          <div style={{fontSize:10, color:"#444", letterSpacing:.8, marginBottom:4}}>COMPLETED</div>
          {completed.map(t => {
            const mod   = getModule(t.moduleId);
            const color = mod ? mod.color : "#4ECDC4";
            return (
              <div key={t.id} style={{display:"flex", alignItems:"center", gap:10,
                padding:"7px 12px", borderRadius:8, opacity:0.5,
                borderLeft: mod ? `3px solid ${color}` : "1px solid transparent"}}>
                <input type="checkbox" checked={true} onChange={() => onToggle(t.id)}
                  style={{width:15, height:15, accentColor:"#4ECDC4", cursor:"pointer", flexShrink:0}}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:12, color:"#666", textDecoration:"line-through",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{t.text}</div>
                  {mod && <span style={{fontSize:10, color:color}}>{mod.code}</span>}
                </div>
                <button onClick={() => onDelete(t.id)}
                  style={{background:"none", border:"none", color:"#333", fontSize:16,
                    cursor:"pointer", padding:"0 2px", lineHeight:1}}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {todos.length === 0 && (
        <p style={{color:"#333", fontSize:12, padding:"4px 0"}}>
          No tasks yet — add one above ↑
        </p>
      )}
    </div>
  );
}

// ─── Module Daily Tasks (shown at top of module detail page) ──────────────────
function ModuleTodayTasks({ todos, mod, onAdd, onToggle, onDelete, isMobile, card, sectionLabel }) {
  const [input, setInput]   = useState("");
  const [expanded, setExpanded] = useState(true);

  const pending   = todos.filter(t => !t.done);
  const completed = todos.filter(t => t.done);
  const today     = new Date().toISOString().slice(0,10);
  const isNew     = (t) => (t.createdAt||"").slice(0,10) === today;

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input);
    setInput("");
  };

  return (
    <div style={{
      marginBottom: 18,
      borderRadius: 12,
      border: `1px solid ${mod.color}33`,
      borderLeft: `3px solid ${mod.color}`,
      background: "#131315",
      overflow: "hidden",
    }}>
      {/* Header — always visible, click to collapse */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "11px 14px" : "13px 18px",
          cursor: "pointer", userSelect: "none",
        }}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <span style={{fontSize:10, color:mod.color, fontWeight:700, letterSpacing:1.2}}>
            TODAY'S TASKS
          </span>
          {pending.length > 0 && (
            <span style={{
              background: mod.color+"22", color: mod.color,
              fontSize:10, fontWeight:700, padding:"1px 7px",
              borderRadius:10, border:`1px solid ${mod.color}33`
            }}>{pending.length}</span>
          )}
          {completed.length > 0 && (
            <span style={{fontSize:10, color:"#555"}}>{completed.length} done</span>
          )}
        </div>
        <span style={{fontSize:12, color:"#555"}}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{padding: isMobile ? "0 14px 14px" : "0 18px 16px"}}>

          {/* Add input */}
          <div style={{
            display:"flex", gap:8, marginBottom: todos.length > 0 ? 12 : 0,
            flexDirection: isMobile ? "column" : "row"
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder={`Add a task for ${mod.code} today...`}
              style={{
                flex:1, background:"#0d0d0f", border:"1px solid #2a2a2e",
                color:"#E0E0DE", padding:"8px 12px", borderRadius:8,
                fontFamily:"inherit", fontSize:12, outline:"none",
                width: isMobile ? "100%" : "auto"
              }}
            />
            <button onClick={handleAdd} style={{
              padding:"8px 16px", borderRadius:8,
              background: mod.color+"22", color: mod.color,
              border:`1px solid ${mod.color}44`,
              fontFamily:"inherit", fontSize:12, fontWeight:600,
              cursor:"pointer", whiteSpace:"nowrap", flexShrink:0
            }}>+ Add</button>
          </div>

          {/* Pending */}
          {pending.map(t => (
            <div key={t.id} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"8px 12px", background:"#0d0d0f", borderRadius:8,
              border:"1px solid #1e1e22", marginBottom:6
            }}>
              <input type="checkbox" checked={false} onChange={() => onToggle(t.id)}
                style={{width:15, height:15, accentColor:mod.color, cursor:"pointer", flexShrink:0}}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, color:"#E0E0DE", overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{t.text}</div>
                {!isNew(t) && (
                  <span style={{fontSize:9, color:"#F7A84A", background:"#F7A84A11",
                    padding:"1px 5px", borderRadius:4, border:"1px solid #F7A84A22"}}>
                    carried over
                  </span>
                )}
              </div>
              <button onClick={() => onDelete(t.id)}
                style={{background:"none", border:"none", color:"#333",
                  fontSize:16, cursor:"pointer", padding:"0 2px", lineHeight:1, flexShrink:0}}
                onMouseEnter={e => e.currentTarget.style.color="#F76A6A"}
                onMouseLeave={e => e.currentTarget.style.color="#333"}>×</button>
            </div>
          ))}

          {/* Completed */}
          {completed.map(t => (
            <div key={t.id} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"7px 12px", borderRadius:8, opacity:0.45, marginBottom:5
            }}>
              <input type="checkbox" checked={true} onChange={() => onToggle(t.id)}
                style={{width:15, height:15, accentColor:"#4ECDC4", cursor:"pointer", flexShrink:0}}/>
              <span style={{flex:1, fontSize:12, color:"#666",
                textDecoration:"line-through", overflow:"hidden",
                textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{t.text}</span>
              <button onClick={() => onDelete(t.id)}
                style={{background:"none", border:"none", color:"#333",
                  fontSize:16, cursor:"pointer", padding:"0 2px", lineHeight:1}}>×</button>
            </div>
          ))}

          {todos.length === 0 && (
            <p style={{fontSize:12, color:"#333", paddingTop:4}}>
              No tasks for {mod.code} today — add one above ↑
            </p>
          )}
        </div>
      )}
    </div>
  );
}