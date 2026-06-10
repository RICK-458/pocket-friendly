import { useState, useEffect } from "react";
import "./App.css";
import { api, getToken, clearToken } from "./api";
import AuthPage from "./components/auth/AuthPage";
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

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [paymentAmount, setPaymentAmount] = useState("");

  // Restore session on startup; react to forced logout (expired token)
  useEffect(() => {
    const onForcedLogout = () => setUser(null);
    window.addEventListener("pf:logout", onForcedLogout);

    if (getToken()) {
      api.me()
        .then(setUser)
        .catch(() => clearToken())
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
    return () => window.removeEventListener("pf:logout", onForcedLogout);
  }, []);

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setTab("dashboard");
  }

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

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src="/logo.png" alt="Loading" style={{ height: 60 }} />
      </div>
    );
  }

  if (!user) return <AuthPage onAuth={setUser} />;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "var(--black)", borderBottom: "3px solid var(--yellow)", padding: "0.55rem 0.9rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.45rem", color: "var(--yellow)", letterSpacing: "0.06em" }}>POCKET</span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.45rem", color: "var(--white)", letterSpacing: "0.06em" }}>-FRIENDLY</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ color: "#aaa", fontSize: "0.62rem", fontWeight: 700, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
          <button onClick={handleLogout} title="Log out" style={{ background: "var(--yellow)", border: "2px solid var(--black)", borderRadius: 3, padding: "2px 8px", fontSize: "0.6rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}>
            LOGOUT
          </button>
          <img src="/logo.png" alt="Pocket-Friendly logo" style={{ height: 30, width: "auto", display: "block" }} />
        </div>
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
