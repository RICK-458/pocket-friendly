import { useState, useEffect, useCallback } from "react";
import { api } from "../../api";
import { todayStr, CATS, COLORS, pct } from "../../utils/helpers";
import Loading from "../common/Loading";
import ErrorCard from "../common/ErrorCard";
import LimitsModal from "./LimitsModal";

export default function Expenses() {
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
