import { useState } from "react";
import { api } from "../../api";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const user = mode === "login"
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      onAuth(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.2rem" }}>
        <img src="/logo.png" alt="Pocket-Friendly logo" style={{ height: 42 }} />
        <div>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.9rem", letterSpacing: "0.06em" }}>POCKET</span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.9rem", color: "#888", letterSpacing: "0.06em" }}>-FRIENDLY</span>
        </div>
      </div>

      <form className="nb-card" style={{ width: "100%", maxWidth: 380 }} onSubmit={submit}>
        <div className="modal-title" style={{ marginBottom: "0.9rem" }}>
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {mode === "register" && (
            <div><label>Name</label><input className="nb-input" type="text" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          )}
          <div><label>Email</label><input className="nb-input" type="email" inputMode="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
          <div><label>Password</label><input className="nb-input" type="password" placeholder={mode === "register" ? "Min 6 characters" : "Your password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>

          {error && (
            <div style={{ background: "#FFEAEA", border: "2px solid var(--red)", borderRadius: 4, padding: "0.5rem 0.7rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--red)" }}>
              ⚠ {error}
            </div>
          )}

          <button className="nb-btn green" type="submit" disabled={busy} style={{ width: "100%", fontSize: "1rem", padding: "0.8rem", marginTop: 4 }}>
            {busy ? "Please wait…" : mode === "login" ? "🔓 Log In" : "✓ Sign Up"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "0.9rem", fontSize: "0.78rem" }}>
          {mode === "login" ? (
            <>No account?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(""); }} style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem", textDecoration: "underline", padding: 0 }}>
                Sign up
              </button></>
          ) : (
            <>Already have an account?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem", textDecoration: "underline", padding: 0 }}>
                Log in
              </button></>
          )}
        </div>
      </form>

      <div style={{ marginTop: "0.9rem", fontSize: "0.65rem", color: "#999", textAlign: "center" }}>
        Your expenses are private — each account only sees its own data.
      </div>
    </div>
  );
}
