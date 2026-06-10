// Date helpers — UTC-based, matching the frontend's use of toISOString().

export const todayStr = () => new Date().toISOString().slice(0, 10);

// Start of the current week (Sunday), same convention as the frontend
export const weekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
};

// First day of the current month as 'YYYY-MM-01'
export const monthStartStr = () => `${new Date().toISOString().slice(0, 7)}-01`;
