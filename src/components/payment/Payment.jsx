import { useState, useEffect } from "react";
import { api, loadRazorpayCheckout } from "../../api";
import TxList from "./TxList";

export default function Payment({ initialAmount = "" }) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState("form");
  const [txHistory, setTxHistory] = useState([]);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.listPayments().then(setTxHistory).catch(() => { });
  }, []);

  useEffect(() => {
    if (!initialAmount || Number.isNaN(Number(initialAmount)) || Number(initialAmount) <= 0) return;
    setAmount(String(Number(initialAmount)));
  }, [initialAmount]);

  function handlePay() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setStep("confirm");
  }
  
  async function confirmPay() {
    if (paying) return;
    setPaying(true);
    try {
      const order = await api.createOrder({ amount: Number(amount), recipientName: name, note });
      await loadRazorpayCheckout();
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Pocket-Friendly",
        description: note || (name ? `Payment to ${name}` : "Payment"),
        prefill: { name: name || "" },
        theme: { color: "#1a1a1a" },
        modal: {
          ondismiss: () => {
            setPaying(false);
            api.markPaymentFailed(order.orderId, "Checkout closed before payment").catch(() => { });
          },
        },
        handler: async (resp) => {
          try {
            await api.verifyPayment(resp);
            setTxHistory(await api.listPayments());
            setStep("success");
          } catch (e) {
            alert(`Payment verification failed: ${e.message}`);
          } finally {
            setPaying(false);
          }
        },
      });
      rzp.on("payment.failed", (resp) => {
        api.markPaymentFailed(order.orderId, resp?.error?.description || "Payment failed").catch(() => { });
      });
      rzp.open();
    } catch (e) {
      alert(e.message);
      setPaying(false);
    }
  }
  function reset() { setAmount(""); setName(""); setNote(""); setStep("form"); }

  if (step === "success") return (
    <div>
      <div className="section-title">Payment</div>
      <div className="nb-card" style={{ textAlign: "center", padding: "2rem 1rem", background: "#E8F8F2" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>✅</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.75rem", color: "var(--green)", marginBottom: 4 }}>Payment Successful!</div>
        <div style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>₹{Number(amount).toLocaleString()}</div>
        <div style={{ color: "#555", fontSize: "0.82rem", marginBottom: "1.5rem" }}>Paid to {name || "Razorpay"} · verified ✓</div>
        <button className="nb-btn green" style={{ width: "100%" }} onClick={reset}>Make Another Payment</button>
      </div>
      <TxList txHistory={txHistory} />
    </div>
  );

  if (step === "confirm") return (
    <div>
      <div className="section-title">Confirm</div>
      <div className="nb-card" style={{ marginBottom: "0.9rem", textAlign: "center", padding: "1.5rem 1rem" }}>
        <div style={{ fontSize: "0.72rem", color: "#888", textTransform: "uppercase", fontWeight: 700 }}>You are paying</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2.6rem", margin: "0.4rem 0", lineHeight: 1 }}>₹{Number(amount).toLocaleString()}</div>
        <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>To: {name || "Razorpay Checkout"}</div>
        {note && <div style={{ color: "#666", fontSize: "0.8rem", marginTop: 4 }}>Note: {note}</div>}
        <div style={{ marginTop: 10 }}>
          <span style={{ background: "#FFE600", color: "#1a1a1a", border: "2px solid var(--black)", borderRadius: 3, padding: "2px 10px", fontSize: "0.68rem", fontWeight: 700 }}>
            🛡 RAZORPAY · TEST MODE
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button className="nb-btn green" style={{ width: "100%", fontSize: "1rem", padding: "0.85rem" }} onClick={confirmPay} disabled={paying}>{paying ? "Opening Razorpay…" : "🔒 Pay with Razorpay"}</button>
        <button className="nb-btn white" style={{ width: "100%" }} onClick={() => setStep("form")} disabled={paying}>← Go Back</button>
      </div>
      <div style={{ textAlign: "center", marginTop: "0.65rem", fontSize: "0.65rem", color: "#aaa" }}>🔐 Razorpay Test Mode — no real money is transferred</div>
    </div>
  );

  return (
    <div>
      <div className="section-title">Payment</div>
      <div style={{ background: "var(--yellow)", border: "var(--border)", borderRadius: 4, padding: "0.55rem 0.85rem", marginBottom: "0.85rem", fontSize: "0.76rem", fontWeight: 700, boxShadow: "var(--shadow-sm)" }}>
        Calculate in Calc tab, then pay here!
      </div>
      <div className="nb-card">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div><label>Amount (₹) *</label><input className="nb-input" type="number" inputMode="decimal" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <div><label>Pay To (optional)</label><input className="nb-input" type="text" placeholder="Who are you paying?" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label>Note (optional)</label><input className="nb-input" type="text" placeholder="What's this for?" value={note} onChange={e => setNote(e.target.value)} /></div>
          <button className="nb-btn blue" style={{ width: "100%", fontSize: "1rem", padding: "0.85rem", marginTop: 4 }} onClick={handlePay}>Proceed to Pay</button>
        </div>
      </div>
      <TxList txHistory={txHistory} />
    </div>
  );
}
