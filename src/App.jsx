import { useState, useEffect } from "react";
import "./App.css";
import Dashboard from "./components/dashboard/Dashboard";
import Expenses from "./components/expenses/Expenses";
import Reminders from "./components/reminders/Reminders";
import Calculator from "./components/calculator/Calculator";
import Payment from "./components/payment/Payment";

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
        <img src="/logo.png" alt="Pocket-Friendly logo" style={{ height: 30, width: "auto", display: "block" }} />
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
