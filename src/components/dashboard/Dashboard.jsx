import { useState, useEffect } from "react";
import { api } from "../../api";
import { todayStr, COLORS, barCol, pct } from "../../utils/helpers";
import Loading from "../common/Loading";
import ErrorCard from "../common/ErrorCard";

export default function Dashboard() {
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
