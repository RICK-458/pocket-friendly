import { useState } from "react";

export default function LimitsModal({ limits, onSave, onClose }) {
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
