// ─── SHARED HELPERS ──────────────────────────────────────────────────────────

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const CATS = ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Savings", "Other"];

export const COLORS = {
  Food: "#FFE600",
  Transport: "#4169FF",
  Shopping: "#FF6B9D",
  Bills: "#FF7A2F",
  Health: "#00C896",
  Entertainment: "#FF3B3B",
  Savings: "#9B59FF",
  Other: "#888",
};

export const barCol = p => p >= 90 ? "#FF3B3B" : p >= 70 ? "#FF7A2F" : "#00C896";

export const pct = (v, m) => Math.min(100, Math.round((v / (m || 1)) * 100));
