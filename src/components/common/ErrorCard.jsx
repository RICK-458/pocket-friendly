export default function ErrorCard({ msg }) {
  return (
    <div className="nb-card" style={{ borderLeft: "5px solid var(--red)", padding: "0.8rem" }}>
      <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--red)" }}>⚠ Couldn't reach the server</div>
      <div style={{ fontSize: "0.72rem", color: "#666", marginTop: 4 }}>{msg}</div>
      <div style={{ fontSize: "0.68rem", color: "#888", marginTop: 6 }}>Is the backend running? Start it with <code>npm run dev</code> inside the backend folder.</div>
    </div>
  );
}
