import { useState } from "react";

export default function Calculator({ onPayFromCalc }) {
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
          <div style={{ color: "#888", fontSize: "0.75rem", minHeight: 17, marginBottom: 2 }}>{stored !== null ? `${stored} ${op}` : " "}</div>
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
