export default function ReminderCard({ r, accent, onPay, onDelete }) {
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
        {!r.paid && <button className="nb-btn green sm" onClick={() => onPay(r.id)}>✓ Paid</button>}
        <button className="nb-btn red sm" onClick={() => onDelete(r.id)}>✕ Delete</button>
      </div>
    </div>
  );
}
