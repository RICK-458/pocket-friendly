export default function TxList({ txHistory }) {
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
