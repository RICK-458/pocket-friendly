import { useState, useEffect, useCallback } from "react";
import { api } from "../../api";
import { todayStr } from "../../utils/helpers";
import Loading from "../common/Loading";
import ErrorCard from "../common/ErrorCard";
import ReminderCard from "./ReminderCard";

export default function Reminders() {
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
    { title: "Overdue", items: reminders.filter(r => r.status === "overdue"), accent: "var(--red)" },
    { title: "Due Today", items: reminders.filter(r => r.status === "due_today"), accent: "var(--orange)" },
    { title: "Upcoming", items: reminders.filter(r => r.status === "upcoming"), accent: "var(--blue)" },
    { title: "Paid (auto-renewing)", items: reminders.filter(r => r.status === "paid"), accent: "var(--green)" },
  ];

  return (
    <div>
      <div className="section-title">Bill Reminders</div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.85rem" }}>
        <button className="nb-btn" onClick={() => setShowAdd(true)}>+ New Reminder</button>
      </div>

      {groups.map(g => g.items.length > 0 && (
        <div key={g.title} style={{ marginBottom: "0.9rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", color: g.accent, marginBottom: 6 }}>{g.title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {g.items.map(r => <ReminderCard key={r.id} r={r} accent={g.accent} onPay={markPaid} onDelete={delReminder} />)}
          </div>
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
