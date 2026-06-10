
// ─── API CLIENT ──────────────────────────────────────────────────────────────
// Thin fetch wrapper around the Express backend. All requests go through the
// Vite dev proxy (/api → http://localhost:5000), so no CORS config is needed
// in development.

const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const detail = json.errors?.length ? ` — ${json.errors.map(e => e.message).join(", ")}` : "";
    throw new Error((json.message || `Request failed (${res.status})`) + detail);
  }
  return json.data;
}

// Loads the Razorpay Checkout script once, on demand.
let razorpayScriptPromise = null;
export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = resolve;
      s.onerror = () => {
        razorpayScriptPromise = null;
        reject(new Error("Could not load Razorpay Checkout — check your internet connection"));
      };
      document.body.appendChild(s);
    });
  }
  return razorpayScriptPromise;
}

function qs(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ─── MAPPERS (server rows ⇄ the shapes the components already use) ───────────

const fromExpense = (r) => ({
  id: r.id,
  amount: r.amount,
  category: r.category,
  note: r.notes || "",
  title: r.title,
  date: r.expense_date,
});

const toExpense = (e) => ({
  title: (e.note && e.note.trim()) || e.category,
  amount: e.amount,
  category: e.category,
  expense_date: e.date,
  notes: e.note || null,
});

const fromReminder = (r) => ({
  id: r.id,
  name: r.name,
  amount: r.amount,
  dueDate: r.due_date,
  repeat: r.repeat_cycle,
  paid: r.paid,
  lastPaid: r.last_paid,
  status: r.status,
});

const fromTx = (r) => ({
  id: r.id,
  amount: r.amount,
  to: r.recipient,
  name: r.recipient_name || "",
  note: r.note || "",
  method: r.method,
  date: new Date(r.created_at).toLocaleString(),
});

// ─── API SURFACE ─────────────────────────────────────────────────────────────

export const api = {
  // Expenses
  listExpenses: async (params) => {
    const d = await request(`/expenses${qs(params)}`);
    return { items: d.items.map(fromExpense), pagination: d.pagination };
  },
  createExpense: (e) => request("/expenses", { method: "POST", body: toExpense(e) }).then(fromExpense),
  updateExpense: (id, e) => request(`/expenses/${id}`, { method: "PUT", body: toExpense(e) }).then(fromExpense),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: "DELETE" }),
  bulkDeleteExpenses: (ids) => request("/expenses", { method: "DELETE", body: { ids } }),

  // Dashboard (all calculations done in PostgreSQL)
  getDashboardSummary: async () => {
    const d = await request("/dashboard/summary");
    return { ...d, recentTransactions: d.recentTransactions.map(fromExpense) };
  },
  getDashboardCharts: () => request("/dashboard/charts"),

  // Reminders
  listReminders: async () => (await request("/reminders")).map(fromReminder),
  createReminder: (r) =>
    request("/reminders", {
      method: "POST",
      body: { name: r.name, amount: r.amount, due_date: r.dueDate, repeat_cycle: r.repeat },
    }).then(fromReminder),
  payReminder: (id) => request(`/reminders/${id}/pay`, { method: "POST" }).then(fromReminder),
  deleteReminder: (id) => request(`/reminders/${id}`, { method: "DELETE" }),

  // Settings
  getLimits: () => request("/settings/limits"),
  updateLimits: (limits) => request("/settings/limits", { method: "PUT", body: limits }),
  getSavings: () => request("/settings/savings"),
  addSavings: (amount) => request("/settings/savings/add", { method: "POST", body: { amount } }),

  // Payments (transaction history list — fed by verified Razorpay payments)
  listPayments: async (limit = 20) => (await request(`/payments${qs({ limit })}`)).map(fromTx),

  // Razorpay (test mode) — order is created and verified on the backend;
  // the secret key never reaches the browser.
  createOrder: (p) =>
    request("/payments/create-order", {
      method: "POST",
      body: { amount: p.amount, recipient_name: p.recipientName || null, note: p.note || null },
    }),
  verifyPayment: (rzpResponse) =>
    request("/payments/verify", {
      method: "POST",
      body: {
        razorpay_order_id: rzpResponse.razorpay_order_id,
        razorpay_payment_id: rzpResponse.razorpay_payment_id,
        razorpay_signature: rzpResponse.razorpay_signature,
      },
    }),
  markPaymentFailed: (orderId, reason) =>
    request("/payments/mark-failed", {
      method: "POST",
      body: { razorpay_order_id: orderId, reason: reason || null },
    }),
  paymentHistory: (params) => request(`/payments/history${qs(params)}`),

  // Categories
  listCategories: () => request("/categories"),
};
