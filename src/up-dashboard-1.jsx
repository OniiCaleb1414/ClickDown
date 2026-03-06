import { useState, useEffect, useMemo } from "react";

const STORAGE_KEY = "up_dashboard_v2";

const PLATFORMS = {
  clickup: { label: "ClickUP", color: "#7C6AF7", bg: "#7C6AF722", placeholder: "https://clickup.up.ac.za/..." },
  ams:     { label: "AMS",     color: "#F7A84A", bg: "#F7A84A22", placeholder: "https://ams.up.ac.za/..."     },
  other:   { label: "Other",   color: "#888",    bg: "#88888822", placeholder: "https://..."                  },
};

const defaultData = {
  modules: [
    {
      id: "m1", code: "COS301", name: "Software Engineering", color: "#7C6AF7", passMark: 50,
      assignments: [
        { id: "a1", name: "Mini Project Phase 1", weight: 15, mark: null, dueDate: "2025-03-20", link: "https://clickup.up.ac.za", platform: "clickup", notes: "UML diagrams + requirements doc", done: false },
        { id: "a2", name: "Mini Project Phase 2", weight: 20, mark: null, dueDate: "2025-04-18", link: "", platform: "clickup", notes: "Architecture & design patterns", done: false },
        { id: "a3", name: "Test 1", weight: 25, mark: 72, dueDate: "2025-03-10", link: "", platform: "clickup", notes: "Chapters 1-5", done: true },
        { id: "a4", name: "Exam", weight: 40, mark: null, dueDate: "2025-06-10", link: "", platform: "clickup", notes: "", done: false },
      ],
    },
    {
      id: "m2", code: "COS326", name: "Functional Programming", color: "#F76A6A", passMark: 50,
      assignments: [
        { id: "a5", name: "Haskell Assignment 1", weight: 10, mark: 85, dueDate: "2025-03-05", link: "", platform: "clickup", notes: "Higher order functions", done: true },
        { id: "a6", name: "Haskell Assignment 2", weight: 15, mark: null, dueDate: "2025-04-02", link: "https://clickup.up.ac.za", platform: "clickup", notes: "Monads & type classes", done: false },
        { id: "a7", name: "Test 1", weight: 25, mark: null, dueDate: "2025-03-28", link: "", platform: "clickup", notes: "", done: false },
        { id: "a8", name: "Exam", weight: 50, mark: null, dueDate: "2025-06-15", link: "", platform: "clickup", notes: "", done: false },
      ],
    },
    {
      id: "m3", code: "COS332", name: "Computer Networks", color: "#4ECDC4", passMark: 50,
      assignments: [
        { id: "a9", name: "Practical 1", weight: 10, mark: 78, dueDate: "2025-03-07", link: "", platform: "clickup", notes: "Wireshark analysis", done: true },
        { id: "a10", name: "Test 1", weight: 20, mark: null, dueDate: "2025-03-25", link: "", platform: "clickup", notes: "OSI layers, TCP/IP", done: false },
        { id: "a11", name: "Practical 2", weight: 10, mark: null, dueDate: "2025-04-10", link: "", platform: "clickup", notes: "", done: false },
        { id: "a12", name: "Exam", weight: 60, mark: null, dueDate: "2025-06-12", link: "", platform: "clickup", notes: "", done: false },
      ],
    },
    {
      id: "m4", code: "EBN", name: "Engineering Business & Networks", color: "#F7A84A", passMark: 50,
      assignments: [
        { id: "a13", name: "Practical 1", weight: 10, mark: null, dueDate: "2025-03-22", link: "https://ams.up.ac.za", platform: "ams", notes: "Submit via AMS portal", done: false },
        { id: "a14", name: "Assignment 1", weight: 15, mark: null, dueDate: "2025-04-05", link: "https://ams.up.ac.za", platform: "ams", notes: "Check AMS for rubric & feedback", done: false },
        { id: "a15", name: "Test 1", weight: 25, mark: null, dueDate: "2025-04-01", link: "", platform: "clickup", notes: "", done: false },
        { id: "a16", name: "Exam", weight: 50, mark: null, dueDate: "2025-06-18", link: "", platform: "clickup", notes: "", done: false },
      ],
    },
  ],
};

const loadData = () => {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : defaultData; }
  catch { return defaultData; }
};
const saveData = (d) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} };

const days = (ds) => Math.ceil((new Date(ds) - new Date()) / 86400000);
const urgencyColor = (d) => d < 0 ? "#555" : d <= 3 ? "#F76A6A" : d <= 7 ? "#F7C56A" : "#4ECDC4";

const calcGrade = (assignments) => {
  let e = 0, p = 0;
  assignments.forEach(a => { if (a.mark !== null) { e += (a.mark / 100) * a.weight; p += a.weight; } });
  return p === 0 ? null : ((e / p) * 100).toFixed(1);
};

const calcNeeded = (assignments, target) => {
  let e = 0, r = 0;
  assignments.forEach(a => { if (a.mark !== null) e += (a.mark / 100) * a.weight; else r += a.weight; });
  if (r === 0) return null;
  return Math.max(0, ((target - e) / r) * 100).toFixed(1);
};

const PlatformBadge = ({ platform }) => {
  const p = PLATFORMS[platform] || PLATFORMS.other;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 4, background: p.bg, color: p.color, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, border: `1px solid ${p.color}44` }}>
      {platform === "ams" ? "⬡" : platform === "clickup" ? "◈" : "◎"} {p.label}
    </span>
  );
};

const PlatformLink = ({ link, platform }) => {
  if (!link) return null;
  const p = PLATFORMS[platform] || PLATFORMS.other;
  return (
    <a href={link} target="_blank" rel="noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: p.bg, color: p.color, fontSize: 11, fontWeight: 600, textDecoration: "none", border: `1px solid ${p.color}55` }}>
      Open in {p.label} →
    </a>
  );
};

export default function App() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("dashboard");
  const [activeModule, setActiveModule] = useState(null);
  const [modal, setModal] = useState(null);
  const [targetMark, setTargetMark] = useState(50);
  const [addingModule, setAddingModule] = useState(false);
  const [newModule, setNewModule] = useState({ code: "", name: "", color: "#7C6AF7", passMark: 50 });

  useEffect(() => { saveData(data); }, [data]);

  const allUpcoming = useMemo(() =>
    data.modules.flatMap(m =>
      m.assignments.filter(a => !a.done).map(a => ({ ...a, moduleCode: m.code, moduleColor: m.color, moduleId: m.id }))
    ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 10),
  [data]);

  const updateAssignment = (moduleId, assignId, updates) =>
    setData(d => ({ ...d, modules: d.modules.map(m => m.id !== moduleId ? m : { ...m, assignments: m.assignments.map(a => a.id !== assignId ? a : { ...a, ...updates }) }) }));

  const deleteAssignment = (moduleId, assignId) => {
    setData(d => ({ ...d, modules: d.modules.map(m => m.id !== moduleId ? m : { ...m, assignments: m.assignments.filter(a => a.id !== assignId) }) }));
    setModal(null);
  };

  const addAssignment = (moduleId, form) =>
    setData(d => ({ ...d, modules: d.modules.map(m => m.id !== moduleId ? m : { ...m, assignments: [...m.assignments, { id: "a" + Date.now(), done: false, mark: null, ...form }] }) }));

  const addModuleFn = () => {
    if (!newModule.code || !newModule.name) return;
    setData(d => ({ ...d, modules: [...d.modules, { id: "m" + Date.now(), ...newModule, assignments: [] }] }));
    setNewModule({ code: "", name: "", color: "#7C6AF7", passMark: 50 });
    setAddingModule(false);
  };

  const deleteModule = (id) => { setData(d => ({ ...d, modules: d.modules.filter(m => m.id !== id) })); setActiveModule(null); setView("dashboard"); };

  const mod = activeModule ? data.modules.find(m => m.id === activeModule) : null;

  return (
    <div style={{ fontFamily: "'DM Mono', 'Fira Code', monospace", background: "#0F0F10", minHeight: "100vh", color: "#E8E8E6" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #1a1a1c; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        input, textarea, select { background: #1e1e20; border: 1px solid #2e2e32; color: #E8E8E6; padding: 8px 12px; border-radius: 6px; font-family: inherit; font-size: 13px; outline: none; width: 100%; }
        input:focus, textarea:focus, select:focus { border-color: #7C6AF7; }
        button { cursor: pointer; border: none; font-family: inherit; }
        .progress-bar { height: 4px; background: #222; border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
        .card { background: #161618; border: 1px solid #222226; border-radius: 12px; padding: 20px; }
        .btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; transition: all 0.15s; }
        .btn-primary { background: #7C6AF7; color: white; } .btn-primary:hover { background: #6a58e5; }
        .btn-ghost { background: transparent; color: #888; border: 1px solid #2e2e32; } .btn-ghost:hover { border-color: #555; color: #ccc; }
        .btn-danger { background: transparent; color: #F76A6A; border: 1px solid #F76A6A33; } .btn-danger:hover { background: #F76A6A22; }
        .nav-btn { padding: 8px 14px; border-radius: 8px; font-size: 12px; background: transparent; color: #666; transition: all 0.15s; }
        .nav-btn.active { background: #1e1e22; color: #E8E8E6; } .nav-btn:hover { color: #ccc; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .modal { background: #161618; border: 1px solid #2e2e32; border-radius: 14px; padding: 28px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .chip { padding: 2px 8px; border-radius: 20px; font-size: 11px; border: 1px solid; display: inline-block; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        label { font-size: 11px; color: #666; display: block; margin-bottom: 4px; }
        @media (max-width: 600px) { .grid2 { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1e22", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, background: "#0F0F10", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7C6AF7,#F7A84A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "white", fontFamily: "Syne, sans-serif" }}>UP</div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 15 }}>AcadDesk</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {[["dashboard","Dashboard"],["calendar","Timeline"],["grades","Grades"]].map(([v,l]) => (
            <button key={v} className={`nav-btn ${view===v?"active":""}`} onClick={() => { setView(v); setActiveModule(null); }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && !activeModule && (<>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋
            </h1>
            <p style={{ color: "#666", fontSize: 13 }}>{data.modules.length} modules · {allUpcoming.length} upcoming tasks</p>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 14, letterSpacing: 1 }}>UPCOMING DEADLINES</p>
            {allUpcoming.length === 0 && <p style={{ color: "#555", fontSize: 13 }}>All clear! 🎉</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allUpcoming.map(a => {
                const d = days(a.dueDate);
                return (
                  <div key={a.id} onClick={() => setActiveModule(a.moduleId)}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#0F0F10", borderRadius: 8, border: "1px solid #1e1e22", transition: "border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = a.moduleColor}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e22"}>
                    <div style={{ width: 3, height: 34, borderRadius: 2, background: a.moduleColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#666" }}>{a.moduleCode}</span>
                        <span style={{ color: "#333" }}>·</span>
                        <span style={{ fontSize: 11, color: "#666" }}>{a.weight}% weight</span>
                        <PlatformBadge platform={a.platform} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: urgencyColor(d), fontWeight: 600 }}>{d < 0 ? "Overdue" : d === 0 ? "Today!" : `${d}d`}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>{new Date(a.dueDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#666", marginBottom: 14, letterSpacing: 1 }}>MODULES</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 14 }}>
            {data.modules.map(m => {
              const grade = calcGrade(m.assignments);
              const upcoming = m.assignments.filter(a => !a.done).length;
              const assessed = m.assignments.reduce((s, a) => s + (a.mark !== null ? a.weight : 0), 0);
              const total = m.assignments.reduce((s, a) => s + a.weight, 0);
              const hasAms = m.assignments.some(a => a.platform === "ams");
              return (
                <div key={m.id} className="card" style={{ cursor: "pointer", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = m.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#222226"}
                  onClick={() => setActiveModule(m.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: m.color, fontWeight: 700, letterSpacing: 1 }}>{m.code}</span>
                        {hasAms && <PlatformBadge platform="ams" />}
                      </div>
                      <div style={{ fontSize: 15, fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{m.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Syne, sans-serif", color: grade ? (parseFloat(grade) >= m.passMark ? "#4ECDC4" : "#F76A6A") : "#555" }}>{grade ? `${grade}%` : "—"}</div>
                      <div style={{ fontSize: 10, color: "#555" }}>current</div>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: 10 }}>
                    <div className="progress-fill" style={{ width: total > 0 ? `${(assessed / total) * 100}%` : "0%", background: m.color }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666" }}>
                    <span>{upcoming} pending</span>
                    <span>{assessed}/{total}% assessed</span>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn btn-ghost" style={{ width: "100%", padding: 12, fontSize: 13 }} onClick={() => setAddingModule(true)}>+ Add Module</button>
        </>)}

        {/* MODULE DETAIL */}
        {view === "dashboard" && activeModule && mod && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setActiveModule(null)}>← Back</button>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: mod.color }} />
            <span style={{ fontSize: 11, color: mod.color, fontWeight: 700, letterSpacing: 1 }}>{mod.code}</span>
            <span style={{ fontSize: 15, fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{mod.name}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
            {[50, 60, 75].map(t => {
              const needed = calcNeeded(mod.assignments, t);
              const grade = calcGrade(mod.assignments);
              const done = grade && parseFloat(grade) >= t;
              return (
                <div key={t} className="card" style={{ textAlign: "center", cursor: "pointer", borderColor: targetMark === t ? mod.color : "#222226" }} onClick={() => setTargetMark(t)}>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>To get {t}%</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "Syne, sans-serif", color: done ? "#4ECDC4" : needed === null ? "#555" : parseFloat(needed) > 100 ? "#F76A6A" : "#E8E8E6" }}>
                    {done ? "✓" : needed === null ? "—" : parseFloat(needed) > 100 ? "!" : `${needed}%`}
                  </div>
                  <div style={{ fontSize: 10, color: "#555" }}>{done ? "Reached!" : needed === null ? "no data" : parseFloat(needed) > 100 ? "not achievable" : "avg needed"}</div>
                </div>
              );
            })}
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>Current</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "Syne, sans-serif", color: mod.color }}>{calcGrade(mod.assignments) || "—"}%</div>
              <div style={{ fontSize: 10, color: "#555" }}>of assessed</div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: "#666", letterSpacing: 1 }}>ASSESSMENTS</p>
              <button className="btn btn-primary" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => setModal({ type: "add-assign", moduleId: mod.id })}>+ Add</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {mod.assignments.map(a => {
                const d = days(a.dueDate);
                return (
                  <div key={a.id} style={{ padding: "14px 16px", background: a.done ? "#111" : "#0F0F10", borderRadius: 10, border: `1px solid ${a.done ? "#1a1a1c" : "#1e1e22"}`, opacity: a.done ? 0.6 : 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <input type="checkbox" checked={a.done} onChange={e => updateAssignment(mod.id, a.id, { done: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: mod.color, cursor: "pointer", marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, textDecoration: a.done ? "line-through" : "none", color: a.done ? "#555" : "#E8E8E6" }}>{a.name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            {a.mark !== null
                              ? <span style={{ fontSize: 14, fontWeight: 700, color: a.mark >= 50 ? "#4ECDC4" : "#F76A6A" }}>{a.mark}%</span>
                              : <span style={{ color: "#444", fontSize: 12 }}>—</span>}
                            <button style={{ background: "none", color: "#555", fontSize: 14, padding: "2px 6px" }}
                              onClick={() => setModal({ type: "edit-assign", moduleId: mod.id, assign: a })}>✎</button>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                          <span className="chip" style={{ color: mod.color, borderColor: mod.color + "44" }}>{a.weight}% weight</span>
                          <PlatformBadge platform={a.platform} />
                          {!a.done && <span className="chip" style={{ color: urgencyColor(d), borderColor: urgencyColor(d) + "44" }}>{d < 0 ? "Overdue" : d === 0 ? "Today!" : `${d}d left`}</span>}
                          {a.notes && <span style={{ fontSize: 11, color: "#555" }}>{a.notes}</span>}
                        </div>
                        {a.link && <div style={{ marginTop: 10 }}><PlatformLink link={a.link} platform={a.platform} /></div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button className="btn btn-danger" style={{ marginTop: 16, fontSize: 12, padding: "6px 14px" }} onClick={() => deleteModule(mod.id)}>Delete Module</button>
        </>)}

        {/* TIMELINE */}
        {view === "calendar" && (<>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Deadline Timeline</h2>
          {data.modules.flatMap(m => m.assignments.map(a => ({ ...a, moduleCode: m.code, moduleColor: m.color }))).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(a => {
            const d = days(a.dueDate);
            return (
              <div key={a.id} style={{ display: "flex", gap: 16, marginBottom: 6 }}>
                <div style={{ width: 80, textAlign: "right", paddingTop: 12, flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: urgencyColor(d), fontWeight: 600 }}>{d < 0 ? "Overdue" : d === 0 ? "Today" : `${d}d`}</div>
                  <div style={{ fontSize: 10, color: "#555" }}>{new Date(a.dueDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.done ? "#333" : a.moduleColor, marginTop: 13, flexShrink: 0 }} />
                  <div style={{ width: 1, flex: 1, background: "#222", minHeight: 12 }} />
                </div>
                <div className="card" style={{ flex: 1, padding: "12px 16px", opacity: a.done ? 0.5 : 1, borderLeft: `3px solid ${a.moduleColor}`, marginBottom: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 11, color: a.moduleColor, fontWeight: 700, letterSpacing: 0.5 }}>{a.moduleCode}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 10 }}>{a.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span className="chip" style={{ color: "#aaa", borderColor: "#333" }}>{a.weight}%</span>
                      <PlatformBadge platform={a.platform} />
                      {a.done && <span className="chip" style={{ color: "#4ECDC4", borderColor: "#4ECDC422" }}>done</span>}
                      {a.link && <PlatformLink link={a.link} platform={a.platform} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>)}

        {/* GRADES */}
        {view === "grades" && (<>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Grade Calculator</h2>
          <p style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>What do you need on remaining work to hit your target?</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
            {[50, 60, 75].map(t => <button key={t} className={`btn ${targetMark === t ? "btn-primary" : "btn-ghost"}`} onClick={() => setTargetMark(t)}>Target: {t}%</button>)}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#666" }}>Custom:</span>
              <input type="number" min={0} max={100} value={targetMark} onChange={e => setTargetMark(Number(e.target.value))} style={{ width: 70 }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.modules.map(m => {
              const grade = calcGrade(m.assignments);
              const needed = calcNeeded(m.assignments, targetMark);
              const total = m.assignments.reduce((s, a) => s + a.weight, 0);
              const assessed = m.assignments.filter(a => a.mark !== null).reduce((s, a) => s + a.weight, 0);
              const already = grade && parseFloat(grade) >= targetMark;
              return (
                <div key={m.id} className="card" style={{ borderLeft: `4px solid ${m.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: m.color, fontWeight: 700 }}>{m.code}</span>
                        {m.assignments.some(a => a.platform === "ams") && <PlatformBadge platform="ams" />}
                      </div>
                      <div style={{ fontSize: 15, fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{m.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 26, fontFamily: "Syne, sans-serif", fontWeight: 800, color: already ? "#4ECDC4" : needed && parseFloat(needed) > 100 ? "#F76A6A" : "#E8E8E6" }}>
                        {already ? "✓" : needed === null ? "—" : parseFloat(needed) > 100 ? "!" : `${needed}%`}
                      </div>
                      <div style={{ fontSize: 11, color: "#666" }}>{already ? "Target reached!" : needed === null ? "No marks yet" : parseFloat(needed) > 100 ? "Not achievable" : "avg needed on remaining"}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
                    {[["Current", grade ? `${grade}%` : "—", grade ? (parseFloat(grade) >= m.passMark ? "#4ECDC4" : "#F76A6A") : "#555"],
                      ["Assessed", `${assessed}/${total}%`, "#E8E8E6"],
                      ["Pass mark", `${m.passMark}%`, "#E8E8E6"]].map(([lbl, val, col]) => (
                      <div key={lbl} style={{ background: "#111", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>{lbl}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: col }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>Breakdown</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {m.assignments.map(a => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <div style={{ width: 90, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{a.name}</div>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: a.mark !== null ? `${a.mark}%` : "0%", background: a.mark !== null ? (a.mark >= 50 ? "#4ECDC4" : "#F76A6A") : "#2a2a2e" }} />
                        </div>
                        <div style={{ width: 38, textAlign: "right", color: a.mark !== null ? "#E8E8E6" : "#444", flexShrink: 0 }}>{a.mark !== null ? `${a.mark}%` : "—"}</div>
                        <div style={{ width: 28, color: m.color, textAlign: "right", flexShrink: 0 }}>{a.weight}%</div>
                        <PlatformBadge platform={a.platform} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>)}
      </div>

      {/* MODALS */}
      {(modal || addingModule) && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setModal(null); setAddingModule(false); } }}>
          <div className="modal">
            {addingModule && (<>
              <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, marginBottom: 20 }}>Add Module</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="grid2">
                  <div><label>Module Code</label><input placeholder="EBN101" value={newModule.code} onChange={e => setNewModule(v => ({ ...v, code: e.target.value }))} /></div>
                  <div><label>Pass Mark %</label><input type="number" value={newModule.passMark} onChange={e => setNewModule(v => ({ ...v, passMark: Number(e.target.value) }))} /></div>
                </div>
                <div><label>Module Name</label><input placeholder="Engineering Business & Networks" value={newModule.name} onChange={e => setNewModule(v => ({ ...v, name: e.target.value }))} /></div>
                <div><label>Colour</label><input type="color" value={newModule.color} onChange={e => setNewModule(v => ({ ...v, color: e.target.value }))} style={{ width: 60, height: 36, padding: 2 }} /></div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                  <button className="btn btn-ghost" onClick={() => setAddingModule(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={addModuleFn}>Add Module</button>
                </div>
              </div>
            </>)}

            {modal?.type === "add-assign" && (
              <AssignForm title="Add Assessment"
                initForm={{ name: "", weight: 10, mark: null, dueDate: "", link: "", notes: "", platform: "clickup" }}
                onSave={(form) => { addAssignment(modal.moduleId, form); setModal(null); }}
                onClose={() => setModal(null)} />
            )}

            {modal?.type === "edit-assign" && (
              <AssignForm title="Edit Assessment"
                initForm={{ ...modal.assign }}
                onSave={(form) => { updateAssignment(modal.moduleId, modal.assign.id, form); setModal(null); }}
                onClose={() => setModal(null)}
                onDelete={() => deleteAssignment(modal.moduleId, modal.assign.id)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignForm({ title, initForm, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(initForm);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const p = PLATFORMS[form.platform] || PLATFORMS.other;
  return (<>
    <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, marginBottom: 20 }}>{title}</h3>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div><label>Name</label><input placeholder="Assignment 1 / Test 2 / Exam" value={form.name || ""} onChange={e => set("name", e.target.value)} /></div>
      <div className="grid2">
        <div><label>Weight %</label><input type="number" value={form.weight || ""} onChange={e => set("weight", Number(e.target.value))} /></div>
        <div><label>Your Mark % (if marked)</label><input type="number" placeholder="Leave blank" value={form.mark ?? ""} onChange={e => set("mark", e.target.value === "" ? null : Number(e.target.value))} /></div>
      </div>
      <div><label>Due Date</label><input type="date" value={form.dueDate || ""} onChange={e => set("dueDate", e.target.value)} /></div>

      <div>
        <label>Submission Platform</label>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(PLATFORMS).map(([key, val]) => (
            <button key={key} onClick={() => set("platform", key)}
              style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 12, fontFamily: "inherit", fontWeight: 600, border: `1px solid ${form.platform === key ? val.color : "#2e2e32"}`, background: form.platform === key ? val.bg : "transparent", color: form.platform === key ? val.color : "#666", transition: "all 0.15s" }}>
              {val.label}
            </button>
          ))}
        </div>
      </div>

      <div><label>Link ({p.label})</label><input placeholder={p.placeholder} value={form.link || ""} onChange={e => set("link", e.target.value)} /></div>
      <div><label>Notes / Topics to Cover</label><textarea rows={2} placeholder="e.g. Submit PDF via AMS, cover chapters 3-6" value={form.notes || ""} onChange={e => set("notes", e.target.value)} /></div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {onDelete ? <button className="btn btn-danger" onClick={onDelete}>Delete</button> : <div />}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (form.name) onSave(form); }}>Save</button>
        </div>
      </div>
    </div>
  </>);
}
