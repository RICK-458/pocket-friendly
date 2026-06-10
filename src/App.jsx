import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { api, loadRazorpayCheckout } from "./api";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().slice(0, 10);
const CATS = ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Savings", "Other"];
const COLORS = { Food: "#FFE600", Transport: "#4169FF", Shopping: "#FF6B9D", Bills: "#FF7A2F", Health: "#00C896", Entertainment: "#FF3B3B", Savings: "#9B59FF", Other: "#888" };
const barCol = p => p >= 90 ? "#FF3B3B" : p >= 70 ? "#FF7A2F" : "#00C896";
const pct = (v, m) => Math.min(100, Math.round((v / (m || 1)) * 100));

function Loading() {
  return <div className="nb-card" style={{ textAlign: "center", color: "#888", fontSize: "0.82rem", padding: "2rem 1rem" }}>Loading…</div>;
}

function ErrorCard({ msg }) {
  return (
    <div className="nb-card" style={{ borderLeft: "5px solid var(--red)", padding: "0.8rem" }}>
      <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--red)" }}>⚠ Couldn't reach the server</div>
      <div style={{ fontSize: "0.72rem", color: "#666", marginTop: 4 }}>{msg}</div>
      <div style={{ fontSize: "0.68rem", color: "#888", marginTop: 6 }}>Is the backend running? Start it with <code>npm run dev</code> inside the backend folder.</div>
    </div>
  );
}

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
  const [paymentAmount, setPaymentAmount] = useState("");

  function handlePayFromCalc(amount) {
    setPaymentAmount(amount);
    setTab("payment");
  }
  const TABS = [
    { id: "dashboard", label: "Home", icon: "/home.png" },
    { id: "expenses", label: "Spend", icon: "/spend.png" },
    { id: "reminders", label: "Bills", icon: "/bill.png" },
    { id: "calculator", label: "Calc", icon: "/calculator.png" },
    { id: "payment", label: "Pay", icon: "/pay.png" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "var(--black)", borderBottom: "3px solid var(--yellow)", padding: "0.55rem 0.9rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.45rem", color: "var(--yellow)", letterSpacing: "0.06em" }}>POCKET</span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.45rem", color: "var(--white)", letterSpacing: "0.06em" }}>-FRIENDLY</span>
        </div>
        <span style={{ background: "var(--yellow)", borderRadius: 3, padding: "2px 7px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.06em" }}>FINTECH</span>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: "0.85rem", maxWidth: 640, margin: "0 auto", width: "100%", paddingBottom: "1.5rem" }}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "expenses" && <Expenses />}
        {tab === "reminders" && <Reminders />}
        {tab === "calculator" && <Calculator onPayFromCalc={handlePayFromCalc} />}
        {tab === "payment" && <Payment initialAmount={paymentAmount} />}
      </main>

      {/* Bottom nav */}
      <nav style={{ background: "var(--card-bg)", borderTop: "var(--border)", padding: "0.38rem 0.4rem", paddingBottom: "calc(0.38rem + env(safe-area-inset-bottom))", display: "flex", gap: "4px", position: "sticky", bottom: 0, zIndex: 50 }}>
        {TABS.map(t => (
          <button key={t.id} className={`nav-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {/* Replaced span with img tag */}
            <img
              src={t.icon}
              alt={t.label}
              style={{ width: "24px", height: "24px", marginBottom: "2px", objectFit: "contain" }}
              className="nav-icon"
            />
            {t.label}
          </button>
        ))}

      </nav>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getDashboardSummary(), api.getDashboardCharts()])
      .then(([s, c]) => { setSummary(s); setCharts(c); })
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div><div className="section-title">Dashboard</div><ErrorCard msg={error} /></div>;
  if (!summary || !charts) return <div><div className="section-title">Dashboard</div><Loading /></div>;

  const today = todayStr();
  const { todayExpenses, weekExpenses, monthlyExpenses, savings, limits, billsDueToday, categoryBreakdown, recentTransactions } = summary;
  const last7 = charts.dailyTrend;
  const maxAmt = Math.max(...last7.map(d => d.total), 1);

  return (
    <div>
      <div className="section-title">Dashboard</div>

      {billsDueToday > 0 && (
        <div style={{ background: "var(--red)", border: "var(--border)", borderRadius: 4, padding: "0.6rem 0.85rem", marginBottom: "0.85rem", display: "flex", gap: 8, alignItems: "center", boxShadow: "var(--shadow-sm)" }}>
          <span>🔔</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.82rem" }}>{billsDueToday} bill{billsDueToday > 1 ? "s" : ""} due TODAY!</span>
        </div>
      )}

      {/* Stat grid */}
      <div className="stat-grid">
        {[
          { label: "Today", val: todayExpenses, limit: limits.daily },
          { label: "This Week", val: weekExpenses, limit: limits.weekly },
          { label: "This Month", val: monthlyExpenses, limit: limits.monthly },
          { label: "Savings", val: savings.total, limit: null },
        ].map(s => {
          const p = s.limit ? pct(s.val, s.limit) : null;
          return (
            <div key={s.label} className="stat-card">
              <div className="stat-lbl">{s.label}</div>
              <div className="stat-val" style={{ color: p !== null ? barCol(p) : "var(--green)" }}>₹{Number(s.val).toLocaleString()}</div>
              {s.limit && <>
                <div style={{ fontSize: "0.6rem", color: "#888", margin: "2px 0 4px" }}>/ ₹{s.limit.toLocaleString()}</div>
                <div className="progress-outer"><div className="progress-inner" style={{ width: p + "%", background: barCol(p) }} /></div>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, textAlign: "right", marginTop: 2 }}>{p}%</div>
              </>}
              {!s.limit && <div style={{ fontSize: "0.6rem", color: "#888", marginTop: 3 }}>Total saved</div>}
            </div>
          );
        })}
      </div>

      {/* 7-day chart */}
      <div className="nb-card" style={{ marginBottom: "0.85rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>📈 Last 7 Days</div>
        <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: 90 }}>
          {last7.map((d, i) => {
            const isToday = d.date === today;
            const bh = Math.max(4, (d.total / maxAmt) * 72);
            const label = new Date(d.date).toLocaleDateString("en", { weekday: "narrow" });
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                {d.total > 0 && <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#555", textAlign: "center", lineHeight: 1 }}>{d.total >= 1000 ? (d.total / 1000).toFixed(1) + "k" : d.total}</div>}
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                  <div style={{ width: "100%", height: bh, background: isToday ? "var(--yellow)" : "var(--blue)", border: "2px solid var(--black)", borderRadius: "2px 2px 0 0" }} />
                </div>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, color: isToday ? "var(--black)" : "#777" }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="nb-card" style={{ marginBottom: "0.85rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>🗂 This Month</div>
          {categoryBreakdown.map(({ category, total }) => (
            <div key={category} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, background: COLORS[category] || "#888", border: "2px solid var(--black)", borderRadius: 2, flexShrink: 0 }} />
              <div style={{ fontSize: "0.72rem", fontWeight: 600, width: 72, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{category}</div>
              <div className="progress-outer" style={{ flex: 1 }}><div className="progress-inner" style={{ width: pct(total, monthlyExpenses) + "%", background: COLORS[category] || "#888" }} /></div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, minWidth: 50, textAlign: "right" }}>₹{total.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent */}
      <div className="nb-card">
        <div style={{ fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>🧾 Recent</div>
        {recentTransactions.length === 0 && <div style={{ color: "#888", fontSize: "0.82rem" }}>No expenses yet — add some in Spend tab!</div>}
        {recentTransactions.map(e => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1.5px solid #e0ddd5", padding: "6px 0", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{ width: 8, height: 8, background: COLORS[e.category] || "#888", border: "2px solid var(--black)", borderRadius: 2, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.note || e.title || e.category}</div>
                <div style={{ fontSize: "0.62rem", color: "#888" }}>{e.date}</div>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--red)", flexShrink: 0 }}>-₹{e.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [savAmt, setSavAmt] = useState("");
  const [form, setForm] = useState({ amount: "", category: "Food", note: "", date: todayStr() });

  const refresh = useCallback(async () => {
    const [s, list] = await Promise.all([
      api.getDashboardSummary(),
      api.listExpenses({ category: filterCat === "All" ? undefined : filterCat, limit: 500, sortBy: "expense_date", order: "desc" }),
    ]);
    setSummary(s); setExpenses(list.items); setError("");
  }, [filterCat]);

  useEffect(() => { refresh().catch(e => setError(e.message)); }, [refresh]);

  async function addExpense() {
    if (!form.amount || isNaN(Number(form.amount))) return;
    try {
      await api.createExpense({ amount: Number(form.amount), category: form.category, note: form.note, date: form.date });
      setForm({ amount: "", category: "Food", note: "", date: todayStr() }); setShowAdd(false);
      await refresh();
    } catch (e) { alert(e.message); }
  }
  async function delExpense(id) {
    try { await api.deleteExpense(id); await refresh(); } catch (e) { alert(e.message); }
  }
  async function saveLimits(nl) {
    try { await api.updateLimits(nl); setShowLimits(false); await refresh(); } catch (e) { alert(e.message); }
  }
  async function addSavings() {
    if (!savAmt || Number(savAmt) <= 0) return;
    try { await api.addSavings(Number(savAmt)); setSavAmt(""); await refresh(); } catch (e) { alert(e.message); }
  }

  if (error) return <div><div className="section-title">Expenses</div><ErrorCard msg={error} /></div>;
  if (!summary) return <div><div className="section-title">Expenses</div><Loading /></div>;

  const { monthlyExpenses, limits, savings } = summary;
  const p = pct(monthlyExpenses, limits.monthly);
  const sorted = expenses; // already filtered + sorted by the backend

  return (
    <div>
      <div className="section-title">Expenses</div>

      {/* Monthly bar */}
      <div className="nb-card" style={{ marginBottom: "0.85rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "#666" }}>Monthly Spend</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.55rem", lineHeight: 1.1 }}>
              ₹{monthlyExpenses.toLocaleString()} <span style={{ fontSize: "0.85rem", color: "#888", fontFamily: "inherit" }}>/ ₹{limits.monthly.toLocaleString()}</span>
            </div>
          </div>
          <button className="nb-btn sm white" style={{ flexShrink: 0 }} onClick={() => setShowLimits(true)}>⚙ Limits</button>
        </div>
        <div className="progress-outer" style={{ height: 15 }}><div className="progress-inner" style={{ width: p + "%", background: p >= 90 ? "var(--red)" : p >= 70 ? "var(--orange)" : "var(--green)" }} /></div>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, marginTop: 3, color: p >= 90 ? "var(--red)" : "#555" }}>{p}% of monthly limit used</div>
      </div>

      {/* Savings */}
      <div className="nb-card" style={{ marginBottom: "0.85rem", background: "#E8F8F2" }}>
        <div style={{ fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", marginBottom: 7 }}>💰 Savings · ₹{Number(savings.total).toLocaleString()}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="nb-input" type="number" inputMode="decimal" placeholder="Amount to save" value={savAmt} onChange={e => setSavAmt(e.target.value)} style={{ flex: 1 }} />
          <button className="nb-btn green sm" style={{ flexShrink: 0 }} onClick={addSavings}>+ Save</button>
        </div>
      </div>

      {/* Filter + Add */}
      <div style={{ display: "flex", gap: 8, marginBottom: "0.85rem", alignItems: "center" }}>
        <select className="nb-select" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ flex: 1 }}>
          <option value="All">All Categories</option>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="nb-btn" style={{ flexShrink: 0 }} onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      {sorted.length === 0 && <div className="nb-card" style={{ textAlign: "center", color: "#888", fontSize: "0.82rem", padding: "2rem 1rem" }}>No expenses. Tap "+ Add" to start!</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {sorted.map(e => (
          <div key={e.id} className="nb-card" style={{ display: "flex", alignItems: "center", gap: 9, padding: "0.65rem 0.85rem" }}>
            <div style={{ width: 10, height: 10, background: COLORS[e.category] || "#888", border: "2px solid var(--black)", borderRadius: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.note || "—"}</div>
              <div style={{ fontSize: "0.62rem", color: "#888", marginTop: 1 }}>
                {e.date} · <span style={{ background: COLORS[e.category], padding: "1px 4px", borderRadius: 2, border: "1px solid #1a1a1a", fontSize: "0.58rem", fontWeight: 700 }}>{e.category}</span>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--red)", flexShrink: 0 }}>-₹{e.amount.toLocaleString()}</div>
            <button className="nb-btn red sm" onClick={() => delExpense(e.id)} style={{ padding: "4px 8px", minHeight: 30, flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Add Expense</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div><label>Amount (₹)</label><input className="nb-input" type="number" inputMode="decimal" placeholder="e.g. 250" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div><label>Category</label><select className="nb-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label>Note</label><input className="nb-input" type="text" placeholder="e.g. Lunch at cafe" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
              <div><label>Date</label><input className="nb-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button className="nb-btn green" style={{ flex: 1 }} onClick={addExpense}>✓ Add</button>
                <button className="nb-btn white" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLimits && <LimitsModal limits={limits} onSave={saveLimits} onClose={() => setShowLimits(false)} />}
    </div>
  );
}

function LimitsModal({ limits, onSave, onClose }) {
  const [vals, setVals] = useState({ ...limits });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">Set Limits</div>
        {["daily", "weekly", "monthly"].map(p => (
          <div key={p} style={{ marginBottom: "0.75rem" }}>
            <label>{p.charAt(0).toUpperCase() + p.slice(1)} (₹)</label>
            <input className="nb-input" type="number" inputMode="decimal" value={vals[p]} onChange={e => setVals({ ...vals, [p]: Number(e.target.value) })} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="nb-btn" style={{ flex: 1 }} onClick={() => onSave(vals)}>✓ Save</button>
          <button className="nb-btn white" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── REMINDERS ───────────────────────────────────────────────────────────────

function Reminders() {
  const [reminders, setReminders] = useState(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", dueDate: todayStr(), repeat: "monthly" });

  const refresh = useCallback(() => api.listReminders().then(r => { setReminders(r); setError(""); }), []);

  useEffect(() => { refresh().catch(e => setError(e.message)); }, [refresh]);

  async function addReminder() {
    if (!form.name || !form.amount) return;
    try {
      await api.createReminder({ name: form.name, amount: Number(form.amount), dueDate: form.dueDate, repeat: form.repeat });
      setForm({ name: "", amount: "", dueDate: todayStr(), repeat: "monthly" }); setShowAdd(false);
      await refresh();
    } catch (e) { alert(e.message); }
  }
  async function markPaid(id) {
    try { await api.payReminder(id); await refresh(); } catch (e) { alert(e.message); }
  }
  async function delReminder(id) {
    try { await api.deleteReminder(id); await refresh(); } catch (e) { alert(e.message); }
  }

  if (error) return <div><div className="section-title">Bill Reminders</div><ErrorCard msg={error} /></div>;
  if (reminders === null) return <div><div className="section-title">Bill Reminders</div><Loading /></div>;

  // Status (overdue / due_today / upcoming / paid) is computed by the backend
  const groups = [
    { title: "🚨 Overdue", items: reminders.filter(r => r.status === "overdue"), accent: "var(--red)" },
    { title: "🔔 Due Today", items: reminders.filter(r => r.status === "due_today"), accent: "var(--orange)" },
    { title: "📅 Upcoming", items: reminders.filter(r => r.status === "upcoming"), accent: "var(--blue)" },
    { title: "✅ Paid (auto-renewing)", items: reminders.filter(r => r.status === "paid"), accent: "var(--green)" },
  ];

  function RCard({ r, accent }) {
    return (
      <div className="nb-card" style={{ padding: "0.65rem 0.8rem", borderLeft: `5px solid ${accent}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
            <div style={{ fontSize: "0.62rem", color: "#888", marginTop: 2 }}>Due: {r.dueDate} · {r.repeat}{r.lastPaid ? ` · Paid: ${r.lastPaid}` : ""}</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>₹{r.amount.toLocaleString()}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!r.paid && <button className="nb-btn green sm" onClick={() => markPaid(r.id)}>✓ Paid</button>}
          <button className="nb-btn red sm" onClick={() => delReminder(r.id)}>✕ Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-title">Bill Reminders</div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.85rem" }}>
        <button className="nb-btn" onClick={() => setShowAdd(true)}>+ New Reminder</button>
      </div>

      {groups.map(g => g.items.length > 0 && (
        <div key={g.title} style={{ marginBottom: "0.9rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", color: g.accent, marginBottom: 6 }}>{g.title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>{g.items.map(r => <RCard key={r.id} r={r} accent={g.accent} />)}</div>
        </div>
      ))}

      {reminders.length === 0 && <div className="nb-card" style={{ textAlign: "center", color: "#888", fontSize: "0.82rem", padding: "2rem 1rem" }}>No reminders yet! Add your bills so you never miss a payment.</div>}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">New Reminder</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div><label>Bill Name</label><input className="nb-input" type="text" placeholder="Netflix, Rent…" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label>Amount (₹)</label><input className="nb-input" type="number" inputMode="decimal" placeholder="e.g. 499" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div><label>Due Date</label><input className="nb-input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
              <div><label>Repeats</label><select className="nb-select" value={form.repeat} onChange={e => setForm({ ...form, repeat: e.target.value })}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="nb-btn" style={{ flex: 1 }} onClick={addReminder}>✓ Add</button>
                <button className="nb-btn white" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CALCULATOR ──────────────────────────────────────────────────────────────

function Calculator({ onPayFromCalc }) {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);
  const [history, setHistory] = useState([]);

  function pressNum(n) { if (fresh) { setDisplay(n); setFresh(false); } else setDisplay(display === "0" ? n : display + n); }
  function pressDot() { if (fresh) { setDisplay("0."); setFresh(false); return; } if (!display.includes(".")) setDisplay(display + "."); }
  function pressOp(o) { setStored(parseFloat(display)); setOp(o); setFresh(true); }
  function pressEq() {
    if (op === null || stored === null) return;
    const a = stored, b = parseFloat(display);
    let r; if (op === "+") r = a + b; else if (op === "−") r = a - b; else if (op === "×") r = a * b; else if (op === "÷") r = b !== 0 ? a / b : 0;
    const rs = parseFloat(r.toFixed(8)).toString();
    setHistory(h => [`${a} ${op} ${b} = ${rs}`, ...h].slice(0, 5));
    setDisplay(rs); setStored(null); setOp(null); setFresh(true);
  }
  function pressDel() { if (fresh || display.length <= 1) { setDisplay("0"); setFresh(true); } else setDisplay(display.slice(0, -1)); }
  function pressClear() { setDisplay("0"); setStored(null); setOp(null); setFresh(true); }

  function handle(b) {
    if (b === "AC") pressClear();
    else if (b === "+/-") setDisplay((parseFloat(display) * -1).toString());
    else if (b === "%") setDisplay((parseFloat(display) / 100).toString());
    else if (["+", "−", "×", "÷"].includes(b)) pressOp(b);
    else if (b === "=") pressEq();
    else if (b === "⌫") pressDel();
    else if (b === ".") pressDot();
    else pressNum(b);
  }
  function cls(b) {
    if (b === "=") return "calc-btn eq";
    if (["+", "−", "×", "÷"].includes(b)) return "calc-btn op";
    if (b === "⌫") return "calc-btn del";
    return "calc-btn";
  }

  const btns = [["AC", "+/-", "%", "÷"], ["7", "8", "9", "×"], ["4", "5", "6", "−"], ["1", "2", "3", "+"], ["0", ".", "⌫", "="]];
  const payableAmount = Number(display);
  const canPay = Number.isFinite(payableAmount) && payableAmount > 0;

  return (
    <div>
      <div className="section-title">Calculator</div>
      <div style={{ maxWidth: 340, margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {/* Display */}
        <div style={{ background: "var(--black)", border: "var(--border)", borderRadius: 4, boxShadow: "var(--shadow)", padding: "0.9rem 0.9rem 0.65rem", textAlign: "right" }}>
          <div style={{ color: "#888", fontSize: "0.75rem", minHeight: 17, marginBottom: 2 }}>{stored !== null ? `${stored} ${op}` : " "}</div>
          <div style={{ color: "var(--yellow)", fontFamily: "'Bebas Neue',sans-serif", fontSize: display.length > 10 ? "1.7rem" : "2.4rem", letterSpacing: 2, wordBreak: "break-all", lineHeight: 1 }}>{display}</div>
        </div>

        {/* Button grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7 }}>
          {btns.map((row, ri) => row.map((b, ci) => (
            <button key={ri + "-" + ci} className={cls(b)} onClick={() => handle(b)}>{b}</button>
          )))}
        </div>

        <button
          className="nb-btn green"
          style={{ width: "100%", fontSize: "0.95rem", padding: "0.8rem" }}
          onClick={() => onPayFromCalc(display)}
          disabled={!canPay}
        >
          Pay ₹{payableAmount.toLocaleString()}
        </button>

        {history.length > 0 && (
          <div className="nb-card" style={{ padding: "0.65rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>History</div>
            {history.map((h, i) => (
              <div key={i} style={{ fontSize: "0.75rem", color: i === 0 ? "var(--black)" : "#999", fontWeight: i === 0 ? 700 : 400, borderBottom: "1px solid #e0ddd5", padding: "3px 0" }}>{h}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAYMENT ─────────────────────────────────────────────────────────────────

function Payment({ initialAmount = "" }) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState("form");
  const [txHistory, setTxHistory] = useState([]);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.listPayments().then(setTxHistory).catch(() => { });
  }, []);

  useEffect(() => {
    if (!initialAmount || Number.isNaN(Number(initialAmount)) || Number(initialAmount) <= 0) return;
    setAmount(String(Number(initialAmount)));
  }, [initialAmount]);

  function handlePay() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setStep("confirm");
  }
  // Opens Razorpay Checkout (test mode). Payment details (card / UPI / bank)
  // are collected inside Razorpay's secure window — they never touch this app.
  async function confirmPay() {
    if (paying) return;
    setPaying(true);
    try {
      const order = await api.createOrder({ amount: Number(amount), recipientName: name, note });
      await loadRazorpayCheckout();
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Pocket-Friendly",
        description: note || (name ? `Payment to ${name}` : "Payment"),
        prefill: { name: name || "" },
        theme: { color: "#1a1a1a" },
        modal: {
          ondismiss: () => {
            setPaying(false);
            api.markPaymentFailed(order.orderId, "Checkout closed before payment").catch(() => { });
          },
        },
        handler: async (resp) => {
          try {
            await api.verifyPayment(resp);
            setTxHistory(await api.listPayments());
            setStep("success");
          } catch (e) {
            alert(`Payment verification failed: ${e.message}`);
          } finally {
            setPaying(false);
          }
        },
      });
      rzp.on("payment.failed", (resp) => {
        api.markPaymentFailed(order.orderId, resp?.error?.description || "Payment failed").catch(() => { });
      });
      rzp.open();
    } catch (e) {
      alert(e.message);
      setPaying(false);
    }
  }
  function reset() { setAmount(""); setName(""); setNote(""); setStep("form"); }

  function TxList() {
    if (!txHistory.length) return null;
    return (
      <div className="nb-card" style={{ marginTop: "0.9rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 7 }}>Recent Payments</div>
        {txHistory.slice(0, 5).map(tx => (
          <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #e0ddd5", padding: "6px 0", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.name || tx.to}</div>
              <div style={{ fontSize: "0.62rem", color: "#888" }}>{tx.date} · {tx.method.toUpperCase()}</div>
            </div>
            <div style={{ fontWeight: 700, color: "var(--red)", flexShrink: 0 }}>-₹{tx.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>
    );
  }

  if (step === "success") return (
    <div>
      <div className="section-title">Payment</div>
      <div className="nb-card" style={{ textAlign: "center", padding: "2rem 1rem", background: "#E8F8F2" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>✅</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.75rem", color: "var(--green)", marginBottom: 4 }}>Payment Successful!</div>
        <div style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>₹{Number(amount).toLocaleString()}</div>
        <div style={{ color: "#555", fontSize: "0.82rem", marginBottom: "1.5rem" }}>Paid to {name || "Razorpay"} · verified ✓</div>
        <button className="nb-btn green" style={{ width: "100%" }} onClick={reset}>Make Another Payment</button>
      </div>
      <TxList />
    </div>
  );

  if (step === "confirm") return (
    <div>
      <div className="section-title">Confirm</div>
      <div className="nb-card" style={{ marginBottom: "0.9rem", textAlign: "center", padding: "1.5rem 1rem" }}>
        <div style={{ fontSize: "0.72rem", color: "#888", textTransform: "uppercase", fontWeight: 700 }}>You are paying</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2.6rem", margin: "0.4rem 0", lineHeight: 1 }}>₹{Number(amount).toLocaleString()}</div>
        <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>To: {name || "Razorpay Checkout"}</div>
        {note && <div style={{ color: "#666", fontSize: "0.8rem", marginTop: 4 }}>Note: {note}</div>}
        <div style={{ marginTop: 10 }}>
          <span style={{ background: "#FFE600", color: "#1a1a1a", border: "2px solid var(--black)", borderRadius: 3, padding: "2px 10px", fontSize: "0.68rem", fontWeight: 700 }}>
            🛡 RAZORPAY · TEST MODE
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button className="nb-btn green" style={{ width: "100%", fontSize: "1rem", padding: "0.85rem" }} onClick={confirmPay} disabled={paying}>{paying ? "Opening Razorpay…" : "🔒 Pay with Razorpay"}</button>
        <button className="nb-btn white" style={{ width: "100%" }} onClick={() => setStep("form")} disabled={paying}>← Go Back</button>
      </div>
      <div style={{ textAlign: "center", marginTop: "0.65rem", fontSize: "0.65rem", color: "#aaa" }}>🔐 Razorpay Test Mode — no real money is transferred</div>
    </div>
  );

  return (
    <div>
      <div className="section-title">Payment</div>
      <div style={{ background: "var(--yellow)", border: "var(--border)", borderRadius: 4, padding: "0.55rem 0.85rem", marginBottom: "0.85rem", fontSize: "0.76rem", fontWeight: 700, boxShadow: "var(--shadow-sm)" }}>
        Calculate in Calc tab, then pay here!
      </div>
      <div className="nb-card" style={{ marginBottom: "0.85rem", display: "flex", gap: 9, alignItems: "center", padding: "0.6rem 0.85rem" }}>
        <span style={{ fontSize: "1.2rem" }}>🛡</span>
        <div style={{ fontSize: "0.74rem", fontWeight: 600, lineHeight: 1.35 }}>
          Pay securely via <b>Razorpay</b> — UPI / QR · Cards · NetBanking · Wallets
          <div style={{ fontSize: "0.62rem", color: "#888", fontWeight: 400 }}>Pick your payment method in the Razorpay window (Test Mode)</div>
        </div>
      </div>
      <div className="nb-card">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div><label>Amount (₹) *</label><input className="nb-input" type="number" inputMode="decimal" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <div><label>Pay To (optional)</label><input className="nb-input" type="text" placeholder="Who are you paying?" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label>Note (optional)</label><input className="nb-input" type="text" placeholder="What's this for?" value={note} onChange={e => setNote(e.target.value)} /></div>
          <button className="nb-btn blue" style={{ width: "100%", fontSize: "1rem", padding: "0.85rem", marginTop: 4 }} onClick={handlePay}>🔒 Proceed to Pay</button>
        </div>
      </div>
      <TxList />
    </div>
  );
}
