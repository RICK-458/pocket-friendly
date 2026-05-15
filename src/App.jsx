import { useState, useEffect } from "react";
import "./App.css";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function load(key, fb) { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } }
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
const todayStr    = () => new Date().toISOString().slice(0, 10);
const weekStart   = () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); };
const monthStr    = () => new Date().toISOString().slice(0, 7);
const CATS = ["Food","Transport","Shopping","Bills","Health","Entertainment","Savings","Other"];
const COLORS = { Food:"#FFE600", Transport:"#4169FF", Shopping:"#FF6B9D", Bills:"#FF7A2F", Health:"#00C896", Entertainment:"#FF3B3B", Savings:"#9B59FF", Other:"#888" };
const barCol = p => p >= 90 ? "#FF3B3B" : p >= 70 ? "#FF7A2F" : "#00C896";
const pct    = (v, m) => Math.min(100, Math.round((v / (m || 1)) * 100));

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => {
    if (!document.querySelector('meta[name="viewport"]')) {
      const m = document.createElement("meta");
      m.name = "viewport"; m.content = "width=device-width,initial-scale=1,maximum-scale=1";
      document.head.appendChild(m);
    }
  }, []);

  const [tab, setTab] = useState("dashboard");
  const TABS = [
    { id:"dashboard", label:"Home",  icon:"📊" },
    { id:"expenses",  label:"Spend", icon:"💸" },
    { id:"reminders", label:"Bills", icon:"🔔" },
    { id:"calculator",label:"Calc",  icon:"🧮" },
    { id:"payment",   label:"Pay",   icon:"💳" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <header style={{ background:"var(--black)", borderBottom:"3px solid var(--yellow)", padding:"0.55rem 0.9rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <div>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.45rem", color:"var(--yellow)", letterSpacing:"0.06em" }}>POCKET</span>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.45rem", color:"var(--white)", letterSpacing:"0.06em" }}>-FRIENDLY</span>
        </div>
        <span style={{ background:"var(--yellow)", borderRadius:3, padding:"2px 7px", fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.06em" }}>FINTECH</span>
      </header>

      {/* Content */}
      <main style={{ flex:1, padding:"0.85rem", maxWidth:640, margin:"0 auto", width:"100%", paddingBottom:"1.5rem" }}>
        {tab==="dashboard"  && <Dashboard />}
        {tab==="expenses"   && <Expenses />}
        {tab==="reminders"  && <Reminders />}
        {tab==="calculator" && <Calculator />}
        {tab==="payment"    && <Payment />}
      </main>

      {/* Bottom nav */}
      <nav style={{ background:"var(--card-bg)", borderTop:"var(--border)", padding:"0.38rem 0.4rem", paddingBottom:"calc(0.38rem + env(safe-area-inset-bottom))", display:"flex", gap:"4px", position:"sticky", bottom:0, zIndex:50 }}>
        {TABS.map(t => (
          <button key={t.id} className={`nav-tab${tab===t.id?" active":""}`} onClick={() => setTab(t.id)}>
            <span className="nav-icon">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

function Dashboard() {
  const expenses  = load("pf_expenses", []);
  const limits    = load("pf_limits", { daily:500, weekly:3000, monthly:12000 });
  const savings   = load("pf_savings", 0);
  const reminders = load("pf_reminders", []);

  const today = todayStr(), ws = weekStart(), mo = monthStr();
  const todayAmt = expenses.filter(e=>e.date===today).reduce((s,e)=>s+e.amount,0);
  const weekAmt  = expenses.filter(e=>e.date>=ws).reduce((s,e)=>s+e.amount,0);
  const moAmt    = expenses.filter(e=>e.date.startsWith(mo)).reduce((s,e)=>s+e.amount,0);
  const dueToday = reminders.filter(r=>!r.paid&&r.dueDate===today).length;

  const catTotals = {};
  expenses.filter(e=>e.date.startsWith(mo)).forEach(e=>{ catTotals[e.category]=(catTotals[e.category]||0)+e.amount; });

  const last7 = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-(6-i));
    const ds=d.toISOString().slice(0,10);
    return { label:d.toLocaleDateString("en",{weekday:"narrow"}), ds, amt:expenses.filter(e=>e.date===ds).reduce((s,e)=>s+e.amount,0) };
  });
  const maxAmt = Math.max(...last7.map(d=>d.amt),1);

  return (
    <div>
      <div className="section-title">Dashboard</div>

      {dueToday>0 && (
        <div style={{ background:"var(--red)", border:"var(--border)", borderRadius:4, padding:"0.6rem 0.85rem", marginBottom:"0.85rem", display:"flex", gap:8, alignItems:"center", boxShadow:"var(--shadow-sm)" }}>
          <span>🔔</span>
          <span style={{ color:"#fff", fontWeight:700, fontSize:"0.82rem" }}>{dueToday} bill{dueToday>1?"s":""} due TODAY!</span>
        </div>
      )}

      {/* Stat grid */}
      <div className="stat-grid">
        {[
          { label:"Today",      val:todayAmt, limit:limits.daily },
          { label:"This Week",  val:weekAmt,  limit:limits.weekly },
          { label:"This Month", val:moAmt,    limit:limits.monthly },
          { label:"💰 Savings", val:savings,  limit:null },
        ].map(s=>{
          const p = s.limit ? pct(s.val,s.limit) : null;
          return (
            <div key={s.label} className="stat-card">
              <div className="stat-lbl">{s.label}</div>
              <div className="stat-val" style={{ color:p!==null?barCol(p):"var(--green)" }}>₹{Number(s.val).toLocaleString()}</div>
              {s.limit && <>
                <div style={{ fontSize:"0.6rem",color:"#888",margin:"2px 0 4px" }}>/ ₹{s.limit.toLocaleString()}</div>
                <div className="progress-outer"><div className="progress-inner" style={{ width:p+"%",background:barCol(p) }}/></div>
                <div style={{ fontSize:"0.6rem",fontWeight:700,textAlign:"right",marginTop:2 }}>{p}%</div>
              </>}
              {!s.limit && <div style={{ fontSize:"0.6rem",color:"#888",marginTop:3 }}>Total saved</div>}
            </div>
          );
        })}
      </div>

      {/* 7-day chart */}
      <div className="nb-card" style={{ marginBottom:"0.85rem" }}>
        <div style={{ fontWeight:700,fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"0.6rem" }}>📈 Last 7 Days</div>
        <div style={{ display:"flex",gap:"4px",alignItems:"flex-end",height:90 }}>
          {last7.map((d,i)=>{
            const isToday=d.ds===today;
            const bh=Math.max(4,(d.amt/maxAmt)*72);
            return (
              <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
                {d.amt>0 && <div style={{ fontSize:"0.5rem",fontWeight:700,color:"#555",textAlign:"center",lineHeight:1 }}>{d.amt>=1000?(d.amt/1000).toFixed(1)+"k":d.amt}</div>}
                <div style={{ flex:1,display:"flex",alignItems:"flex-end",width:"100%" }}>
                  <div style={{ width:"100%",height:bh,background:isToday?"var(--yellow)":"var(--blue)",border:"2px solid var(--black)",borderRadius:"2px 2px 0 0" }}/>
                </div>
                <div style={{ fontSize:"0.58rem",fontWeight:700,color:isToday?"var(--black)":"#777" }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown */}
      {Object.keys(catTotals).length>0 && (
        <div className="nb-card" style={{ marginBottom:"0.85rem" }}>
          <div style={{ fontWeight:700,fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"0.6rem" }}>🗂 This Month</div>
          {Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
            <div key={cat} style={{ display:"flex",alignItems:"center",gap:7,marginBottom:6 }}>
              <div style={{ width:8,height:8,background:COLORS[cat]||"#888",border:"2px solid var(--black)",borderRadius:2,flexShrink:0 }}/>
              <div style={{ fontSize:"0.72rem",fontWeight:600,width:72,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{cat}</div>
              <div className="progress-outer" style={{ flex:1 }}><div className="progress-inner" style={{ width:pct(amt,moAmt)+"%",background:COLORS[cat]||"#888" }}/></div>
              <div style={{ fontSize:"0.72rem",fontWeight:700,minWidth:50,textAlign:"right" }}>₹{amt.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent */}
      <div className="nb-card">
        <div style={{ fontWeight:700,fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"0.6rem" }}>🧾 Recent</div>
        {expenses.length===0 && <div style={{ color:"#888",fontSize:"0.82rem" }}>No expenses yet — add some in Spend tab!</div>}
        {expenses.slice(-5).reverse().map(e=>(
          <div key={e.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1.5px solid #e0ddd5",padding:"6px 0",gap:8 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:0 }}>
              <div style={{ width:8,height:8,background:COLORS[e.category]||"#888",border:"2px solid var(--black)",borderRadius:2,flexShrink:0 }}/>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:600,fontSize:"0.8rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{e.note||e.category}</div>
                <div style={{ fontSize:"0.62rem",color:"#888" }}>{e.date}</div>
              </div>
            </div>
            <div style={{ fontWeight:700,fontSize:"0.88rem",color:"var(--red)",flexShrink:0 }}>-₹{e.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────

function Expenses() {
  const [expenses,  setExpenses]  = useState(()=>load("pf_expenses",[]));
  const [limits,    setLimits]    = useState(()=>load("pf_limits",{daily:500,weekly:3000,monthly:12000}));
  const [savings,   setSavings]   = useState(()=>load("pf_savings",0));
  const [showAdd,   setShowAdd]   = useState(false);
  const [showLimits,setShowLimits]= useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [savAmt,    setSavAmt]    = useState("");
  const [form, setForm] = useState({amount:"",category:"Food",note:"",date:todayStr()});

  function addExpense() {
    if (!form.amount||isNaN(Number(form.amount))) return;
    const updated=[...expenses,{id:Date.now(),amount:Number(form.amount),category:form.category,note:form.note,date:form.date}];
    setExpenses(updated); save("pf_expenses",updated);
    setForm({amount:"",category:"Food",note:"",date:todayStr()}); setShowAdd(false);
  }
  function delExpense(id) { const u=expenses.filter(e=>e.id!==id); setExpenses(u); save("pf_expenses",u); }
  function saveLimits(nl) { setLimits(nl); save("pf_limits",nl); setShowLimits(false); }
  function addSavings() {
    if (!savAmt) return;
    const u=Number(savings)+Number(savAmt); setSavings(u); save("pf_savings",u); setSavAmt("");
  }

  const mo=monthStr();
  const moAmt=expenses.filter(e=>e.date.startsWith(mo)).reduce((s,e)=>s+e.amount,0);
  const p=pct(moAmt,limits.monthly);
  const sorted=[...(filterCat==="All"?expenses:expenses.filter(e=>e.category===filterCat))].sort((a,b)=>b.date.localeCompare(a.date));

  return (
    <div>
      <div className="section-title">Expenses</div>

      {/* Monthly bar */}
      <div className="nb-card" style={{ marginBottom:"0.85rem" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:7 }}>
          <div>
            <div style={{ fontSize:"0.65rem",fontWeight:700,textTransform:"uppercase",color:"#666" }}>Monthly Spend</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.55rem",lineHeight:1.1 }}>
              ₹{moAmt.toLocaleString()} <span style={{ fontSize:"0.85rem",color:"#888",fontFamily:"inherit" }}>/ ₹{limits.monthly.toLocaleString()}</span>
            </div>
          </div>
          <button className="nb-btn sm white" style={{ flexShrink:0 }} onClick={()=>setShowLimits(true)}>⚙ Limits</button>
        </div>
        <div className="progress-outer" style={{ height:15 }}><div className="progress-inner" style={{ width:p+"%",background:p>=90?"var(--red)":p>=70?"var(--orange)":"var(--green)" }}/></div>
        <div style={{ fontSize:"0.65rem",fontWeight:700,marginTop:3,color:p>=90?"var(--red)":"#555" }}>{p}% of monthly limit used</div>
      </div>

      {/* Savings */}
      <div className="nb-card" style={{ marginBottom:"0.85rem",background:"#E8F8F2" }}>
        <div style={{ fontWeight:700,fontSize:"0.7rem",textTransform:"uppercase",marginBottom:7 }}>💰 Savings · ₹{Number(savings).toLocaleString()}</div>
        <div style={{ display:"flex",gap:8 }}>
          <input className="nb-input" type="number" inputMode="decimal" placeholder="Amount to save" value={savAmt} onChange={e=>setSavAmt(e.target.value)} style={{ flex:1 }}/>
          <button className="nb-btn green sm" style={{ flexShrink:0 }} onClick={addSavings}>+ Save</button>
        </div>
      </div>

      {/* Filter + Add */}
      <div style={{ display:"flex",gap:8,marginBottom:"0.85rem",alignItems:"center" }}>
        <select className="nb-select" value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ flex:1 }}>
          <option value="All">All Categories</option>
          {CATS.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <button className="nb-btn" style={{ flexShrink:0 }} onClick={()=>setShowAdd(true)}>+ Add</button>
      </div>

      {sorted.length===0 && <div className="nb-card" style={{ textAlign:"center",color:"#888",fontSize:"0.82rem",padding:"2rem 1rem" }}>No expenses. Tap "+ Add" to start!</div>}

      <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
        {sorted.map(e=>(
          <div key={e.id} className="nb-card" style={{ display:"flex",alignItems:"center",gap:9,padding:"0.65rem 0.85rem" }}>
            <div style={{ width:10,height:10,background:COLORS[e.category]||"#888",border:"2px solid var(--black)",borderRadius:2,flexShrink:0 }}/>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontWeight:700,fontSize:"0.82rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{e.note||"—"}</div>
              <div style={{ fontSize:"0.62rem",color:"#888",marginTop:1 }}>
                {e.date} · <span style={{ background:COLORS[e.category],padding:"1px 4px",borderRadius:2,border:"1px solid #1a1a1a",fontSize:"0.58rem",fontWeight:700 }}>{e.category}</span>
              </div>
            </div>
            <div style={{ fontWeight:700,fontSize:"0.9rem",color:"var(--red)",flexShrink:0 }}>-₹{e.amount.toLocaleString()}</div>
            <button className="nb-btn red sm" onClick={()=>delExpense(e.id)} style={{ padding:"4px 8px",minHeight:30,flexShrink:0 }}>✕</button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div className="modal-title">Add Expense</div>
            <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
              <div><label>Amount (₹)</label><input className="nb-input" type="number" inputMode="decimal" placeholder="e.g. 250" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
              <div><label>Category</label><select className="nb-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label>Note</label><input className="nb-input" type="text" placeholder="e.g. Lunch at cafe" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></div>
              <div><label>Date</label><input className="nb-input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
              <div style={{ display:"flex",gap:8,marginTop:4 }}>
                <button className="nb-btn green" style={{ flex:1 }} onClick={addExpense}>✓ Add</button>
                <button className="nb-btn white" style={{ flex:1 }} onClick={()=>setShowAdd(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLimits && <LimitsModal limits={limits} onSave={saveLimits} onClose={()=>setShowLimits(false)}/>}
    </div>
  );
}

function LimitsModal({limits,onSave,onClose}) {
  const [vals,setVals]=useState({...limits});
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div className="modal-title">Set Limits</div>
        {["daily","weekly","monthly"].map(p=>(
          <div key={p} style={{ marginBottom:"0.75rem" }}>
            <label>{p.charAt(0).toUpperCase()+p.slice(1)} (₹)</label>
            <input className="nb-input" type="number" inputMode="decimal" value={vals[p]} onChange={e=>setVals({...vals,[p]:Number(e.target.value)})}/>
          </div>
        ))}
        <div style={{ display:"flex",gap:8,marginTop:8 }}>
          <button className="nb-btn" style={{ flex:1 }} onClick={()=>onSave(vals)}>✓ Save</button>
          <button className="nb-btn white" style={{ flex:1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── REMINDERS ───────────────────────────────────────────────────────────────

function Reminders() {
  const [reminders,setReminders]=useState(()=>load("pf_reminders",[]));
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",amount:"",dueDate:todayStr(),repeat:"monthly"});

  function addReminder() {
    if (!form.name||!form.amount) return;
    const u=[...reminders,{id:Date.now(),name:form.name,amount:Number(form.amount),dueDate:form.dueDate,repeat:form.repeat,paid:false}];
    setReminders(u); save("pf_reminders",u);
    setForm({name:"",amount:"",dueDate:todayStr(),repeat:"monthly"}); setShowAdd(false);
  }
  function markPaid(id) {
    const u=reminders.map(r=>{
      if (r.id!==id) return r;
      const nx=new Date(r.dueDate);
      if (r.repeat==="daily")   nx.setDate(nx.getDate()+1);
      if (r.repeat==="weekly")  nx.setDate(nx.getDate()+7);
      if (r.repeat==="monthly") nx.setMonth(nx.getMonth()+1);
      if (r.repeat==="yearly")  nx.setFullYear(nx.getFullYear()+1);
      return {...r,paid:true,dueDate:nx.toISOString().slice(0,10),lastPaid:todayStr()};
    });
    setReminders(u); save("pf_reminders",u);
  }
  function delReminder(id) { const u=reminders.filter(r=>r.id!==id); setReminders(u); save("pf_reminders",u); }

  const today=todayStr();
  const groups=[
    {title:"🚨 Overdue",   items:reminders.filter(r=>!r.paid&&r.dueDate<today),  accent:"var(--red)"},
    {title:"🔔 Due Today", items:reminders.filter(r=>!r.paid&&r.dueDate===today), accent:"var(--orange)"},
    {title:"📅 Upcoming",  items:reminders.filter(r=>!r.paid&&r.dueDate>today),   accent:"var(--blue)"},
    {title:"✅ Paid (auto-renewing)", items:reminders.filter(r=>r.paid),           accent:"var(--green)"},
  ];

  function RCard({r,accent}) {
    return (
      <div className="nb-card" style={{ padding:"0.65rem 0.8rem",borderLeft:`5px solid ${accent}` }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:7 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700,fontSize:"0.85rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.name}</div>
            <div style={{ fontSize:"0.62rem",color:"#888",marginTop:2 }}>Due: {r.dueDate} · {r.repeat}{r.lastPaid?` · Paid: ${r.lastPaid}`:""}</div>
          </div>
          <div style={{ fontWeight:700,fontSize:"0.9rem",flexShrink:0 }}>₹{r.amount.toLocaleString()}</div>
        </div>
        <div style={{ display:"flex",gap:6 }}>
          {!r.paid && <button className="nb-btn green sm" onClick={()=>markPaid(r.id)}>✓ Paid</button>}
          <button className="nb-btn red sm" onClick={()=>delReminder(r.id)}>✕ Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-title">Bill Reminders</div>
      <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:"0.85rem" }}>
        <button className="nb-btn" onClick={()=>setShowAdd(true)}>+ New Reminder</button>
      </div>

      {groups.map(g=>g.items.length>0&&(
        <div key={g.title} style={{ marginBottom:"0.9rem" }}>
          <div style={{ fontWeight:700,fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.05em",color:g.accent,marginBottom:6 }}>{g.title}</div>
          <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>{g.items.map(r=><RCard key={r.id} r={r} accent={g.accent}/>)}</div>
        </div>
      ))}

      {reminders.length===0 && <div className="nb-card" style={{ textAlign:"center",color:"#888",fontSize:"0.82rem",padding:"2rem 1rem" }}>No reminders yet! Add your bills so you never miss a payment.</div>}

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div className="modal-title">New Reminder</div>
            <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
              <div><label>Bill Name</label><input className="nb-input" type="text" placeholder="Netflix, Rent…" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
              <div><label>Amount (₹)</label><input className="nb-input" type="number" inputMode="decimal" placeholder="e.g. 499" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
              <div><label>Due Date</label><input className="nb-input" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></div>
              <div><label>Repeats</label><select className="nb-select" value={form.repeat} onChange={e=>setForm({...form,repeat:e.target.value})}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
              <div style={{ display:"flex",gap:8 }}>
                <button className="nb-btn" style={{ flex:1 }} onClick={addReminder}>✓ Add</button>
                <button className="nb-btn white" style={{ flex:1 }} onClick={()=>setShowAdd(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CALCULATOR ──────────────────────────────────────────────────────────────

function Calculator() {
  const [display,setDisplay]=useState("0");
  const [stored,setStored]=useState(null);
  const [op,setOp]=useState(null);
  const [fresh,setFresh]=useState(true);
  const [history,setHistory]=useState([]);

  function pressNum(n) { if(fresh){setDisplay(n);setFresh(false);}else setDisplay(display==="0"?n:display+n); }
  function pressDot() { if(fresh){setDisplay("0.");setFresh(false);return;}if(!display.includes("."))setDisplay(display+"."); }
  function pressOp(o) { setStored(parseFloat(display));setOp(o);setFresh(true); }
  function pressEq() {
    if(op===null||stored===null) return;
    const a=stored,b=parseFloat(display);
    let r; if(op==="+")r=a+b; else if(op==="−")r=a-b; else if(op==="×")r=a*b; else if(op==="÷")r=b!==0?a/b:0;
    const rs=parseFloat(r.toFixed(8)).toString();
    setHistory(h=>[`${a} ${op} ${b} = ${rs}`,...h].slice(0,5));
    setDisplay(rs);setStored(null);setOp(null);setFresh(true);
  }
  function pressDel() { if(fresh||display.length<=1){setDisplay("0");setFresh(true);}else setDisplay(display.slice(0,-1)); }
  function pressClear() { setDisplay("0");setStored(null);setOp(null);setFresh(true); }

  function handle(b) {
    if(b==="AC")pressClear();
    else if(b==="+/-")setDisplay((parseFloat(display)*-1).toString());
    else if(b==="%")setDisplay((parseFloat(display)/100).toString());
    else if(["+","−","×","÷"].includes(b))pressOp(b);
    else if(b==="=")pressEq();
    else if(b==="⌫")pressDel();
    else if(b===".")pressDot();
    else pressNum(b);
  }
  function cls(b) {
    if(b==="=")return"calc-btn eq";
    if(["+","−","×","÷"].includes(b))return"calc-btn op";
    if(b==="⌫")return"calc-btn del";
    return"calc-btn";
  }

  const btns=[["AC","+/-","%","÷"],["7","8","9","×"],["4","5","6","−"],["1","2","3","+"],["0",".","⌫","="]];

  return (
    <div>
      <div className="section-title">Calculator</div>
      <div style={{ maxWidth:340,margin:"0 auto",display:"flex",flexDirection:"column",gap:"0.8rem" }}>
        {/* Display */}
        <div style={{ background:"var(--black)",border:"var(--border)",borderRadius:4,boxShadow:"var(--shadow)",padding:"0.9rem 0.9rem 0.65rem",textAlign:"right" }}>
          <div style={{ color:"#888",fontSize:"0.75rem",minHeight:17,marginBottom:2 }}>{stored!==null?`${stored} ${op}`:"\u00A0"}</div>
          <div style={{ color:"var(--yellow)",fontFamily:"'Bebas Neue',sans-serif",fontSize:display.length>10?"1.7rem":"2.4rem",letterSpacing:2,wordBreak:"break-all",lineHeight:1 }}>{display}</div>
        </div>

        {/* Button grid */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7 }}>
          {btns.map((row,ri)=>row.map((b,ci)=>(
            <button key={ri+"-"+ci} className={cls(b)} onClick={()=>handle(b)}>{b}</button>
          )))}
        </div>

        {history.length>0 && (
          <div className="nb-card" style={{ padding:"0.65rem" }}>
            <div style={{ fontWeight:700,fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>History</div>
            {history.map((h,i)=>(
              <div key={i} style={{ fontSize:"0.75rem",color:i===0?"var(--black)":"#999",fontWeight:i===0?700:400,borderBottom:"1px solid #e0ddd5",padding:"3px 0" }}>{h}</div>
            ))}
          </div>
        )}
        <div style={{ textAlign:"center",fontSize:"0.68rem",color:"#aaa" }}>Built-in · no app-switching needed</div>
      </div>
    </div>
  );
}

// ─── PAYMENT ─────────────────────────────────────────────────────────────────

function Payment() {
  const [amount,setAmount]=useState("");
  const [upiId,setUpiId]=useState("");
  const [name,setName]=useState("");
  const [note,setNote]=useState("");
  const [step,setStep]=useState("form");
  const [method,setMethod]=useState("upi");
  const [txHistory,setTxHistory]=useState(()=>load("pf_tx_history",[]));
  const [cardNum,setCardNum]=useState("");
  const [expiry,setExpiry]=useState("");
  const [cvv,setCvv]=useState("");

  function handlePay() {
    if(!amount||isNaN(Number(amount))||Number(amount)<=0)return;
    if(method==="upi"&&!upiId)return;
    if(method==="card"&&(!cardNum||!expiry||!cvv))return;
    setStep("confirm");
  }
  function confirmPay() {
    const tx={id:Date.now(),amount:Number(amount),to:method==="upi"?upiId:"**** "+cardNum.slice(-4),name,note,method,date:new Date().toLocaleString()};
    const u=[tx,...txHistory].slice(0,20); setTxHistory(u); save("pf_tx_history",u);
    const exps=load("pf_expenses",[]);
    save("pf_expenses",[...exps,{id:Date.now()+1,amount:Number(amount),category:"Other",note:`Payment to ${name||upiId||"card"}`,date:todayStr()}]);
    setStep("success");
  }
  function reset(){setAmount("");setUpiId("");setName("");setNote("");setCardNum("");setExpiry("");setCvv("");setStep("form");}

  function TxList() {
    if(!txHistory.length)return null;
    return(
      <div className="nb-card" style={{ marginTop:"0.9rem" }}>
        <div style={{ fontWeight:700,fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7 }}>Recent Payments</div>
        {txHistory.slice(0,5).map(tx=>(
          <div key={tx.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1.5px solid #e0ddd5",padding:"6px 0",gap:8 }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:600,fontSize:"0.8rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{tx.name||tx.to}</div>
              <div style={{ fontSize:"0.62rem",color:"#888" }}>{tx.date} · {tx.method.toUpperCase()}</div>
            </div>
            <div style={{ fontWeight:700,color:"var(--red)",flexShrink:0 }}>-₹{tx.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>
    );
  }

  if(step==="success")return(
    <div>
      <div className="section-title">Payment</div>
      <div className="nb-card" style={{ textAlign:"center",padding:"2rem 1rem",background:"#E8F8F2" }}>
        <div style={{ fontSize:"3.5rem",marginBottom:"0.5rem" }}>✅</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.75rem",color:"var(--green)",marginBottom:4 }}>Payment Successful!</div>
        <div style={{ fontSize:"2rem",fontWeight:700,marginBottom:"0.5rem" }}>₹{Number(amount).toLocaleString()}</div>
        <div style={{ color:"#555",fontSize:"0.82rem",marginBottom:"1.5rem" }}>Paid to {name||upiId||"card"}</div>
        <button className="nb-btn green" style={{ width:"100%" }} onClick={reset}>Make Another Payment</button>
      </div>
      <TxList/>
    </div>
  );

  if(step==="confirm")return(
    <div>
      <div className="section-title">Confirm</div>
      <div className="nb-card" style={{ marginBottom:"0.9rem",textAlign:"center",padding:"1.5rem 1rem" }}>
        <div style={{ fontSize:"0.72rem",color:"#888",textTransform:"uppercase",fontWeight:700 }}>You are paying</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.6rem",margin:"0.4rem 0",lineHeight:1 }}>₹{Number(amount).toLocaleString()}</div>
        <div style={{ fontWeight:700,fontSize:"0.88rem" }}>To: {name||upiId||"Card ending "+cardNum.slice(-4)}</div>
        {note&&<div style={{ color:"#666",fontSize:"0.8rem",marginTop:4 }}>Note: {note}</div>}
        <div style={{ marginTop:10 }}>
          <span style={{ background:method==="upi"?"#FFE600":"#4169FF",color:method==="upi"?"#1a1a1a":"#fff",border:"2px solid var(--black)",borderRadius:3,padding:"2px 10px",fontSize:"0.68rem",fontWeight:700 }}>
            {method==="upi"?"📱 UPI":"💳 CARD"}
          </span>
        </div>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        <button className="nb-btn green" style={{ width:"100%",fontSize:"1rem",padding:"0.85rem" }} onClick={confirmPay}>🔒 Confirm & Pay</button>
        <button className="nb-btn white" style={{ width:"100%" }} onClick={()=>setStep("form")}>← Go Back</button>
      </div>
      <div style={{ textAlign:"center",marginTop:"0.65rem",fontSize:"0.65rem",color:"#aaa" }}>🔐 Simulated — no real money transferred</div>
    </div>
  );

  return(
    <div>
      <div className="section-title">Payment</div>
      <div style={{ background:"var(--yellow)",border:"var(--border)",borderRadius:4,padding:"0.55rem 0.85rem",marginBottom:"0.85rem",fontSize:"0.76rem",fontWeight:700,boxShadow:"var(--shadow-sm)" }}>
        💡 Calculate in Calc tab, then pay here!
      </div>
      <div style={{ display:"flex",gap:8,marginBottom:"0.85rem" }}>
        <button className={`nb-btn ${method==="upi"?"blue":"white"}`} style={{ flex:1 }} onClick={()=>setMethod("upi")}>📱 UPI</button>
        <button className={`nb-btn ${method==="card"?"blue":"white"}`} style={{ flex:1 }} onClick={()=>setMethod("card")}>💳 Card</button>
      </div>
      <div className="nb-card">
        <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
          <div><label>Amount (₹) *</label><input className="nb-input" type="number" inputMode="decimal" placeholder="Enter amount" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
          {method==="upi"&&<>
            <div><label>UPI ID *</label><input className="nb-input" type="text" inputMode="email" placeholder="name@upi / phone@paytm" value={upiId} onChange={e=>setUpiId(e.target.value)}/></div>
            <div><label>Recipient Name</label><input className="nb-input" type="text" placeholder="Who are you paying?" value={name} onChange={e=>setName(e.target.value)}/></div>
          </>}
          {method==="card"&&<>
            <div><label>Card Number *</label><input className="nb-input" type="text" inputMode="numeric" maxLength={16} placeholder="1234 5678 9012 3456" value={cardNum} onChange={e=>setCardNum(e.target.value.replace(/\D/g,""))}/></div>
            <div style={{ display:"flex",gap:10 }}>
              <div style={{ flex:1 }}><label>Expiry *</label><input className="nb-input" type="text" inputMode="numeric" placeholder="MM/YY" maxLength={5} value={expiry} onChange={e=>setExpiry(e.target.value)}/></div>
              <div style={{ flex:1 }}><label>CVV *</label><input className="nb-input" type="password" inputMode="numeric" placeholder="•••" maxLength={4} value={cvv} onChange={e=>setCvv(e.target.value)}/></div>
            </div>
            <div><label>Name on Card</label><input className="nb-input" type="text" placeholder="Cardholder name" value={name} onChange={e=>setName(e.target.value)}/></div>
          </>}
          <div><label>Note (optional)</label><input className="nb-input" type="text" placeholder="What's this for?" value={note} onChange={e=>setNote(e.target.value)}/></div>
          <button className="nb-btn blue" style={{ width:"100%",fontSize:"1rem",padding:"0.85rem",marginTop:4 }} onClick={handlePay}>🔒 Proceed to Pay</button>
        </div>
      </div>
      <div style={{ textAlign:"center",marginTop:"0.65rem",fontSize:"0.65rem",color:"#aaa" }}>🔐 Simulated payment interface — demo only</div>
      <TxList/>
    </div>
  );
}
