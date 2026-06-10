# Pocket-Friendly Backend

Express + PostgreSQL REST API for the Pocket-Friendly expense tracker.

**Stack:** Node.js · Express · PostgreSQL · pg (node-postgres) · dotenv · cors · helmet · morgan · express-validator

---

## Folder structure

```
backend/
├── src/
│   ├── controllers/     # Thin request handlers (one per resource)
│   ├── routes/          # Express routers + express-validator rules
│   ├── middleware/      # validate.js, errorHandler.js
│   ├── services/        # All SQL queries (pg) — business logic lives here
│   ├── config/          # db.js (pg Pool + type parsers)
│   ├── utils/           # ApiError, asyncHandler, response helpers, dates
│   └── app.js           # Express app (helmet, cors, morgan, routes, errors)
├── database/
│   ├── schema.sql       # CREATE DATABASE + tables + indexes + triggers
│   ├── seed.sql         # Categories, default settings, sample data
│   └── migrations/      # Incremental changes (001: Razorpay payments table)
├── server.js            # Entry point
├── .env.example
└── package.json
```

## Setup

1. **Configure environment** — copy `.env.example` to `.env` and put your real
   PostgreSQL password in `DATABASE_URL`:

   ```
   DATABASE_URL=postgresql://postgres:<your-password>@localhost:5432/pocket_friendly
   ```

2. **Create the database** (psql is at `C:\Program Files\PostgreSQL\15\bin` if not on PATH):

   ```powershell
   & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -f database/schema.sql
   & "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d pocket_friendly -f database/seed.sql
   ```

3. **Install & run**:

   ```powershell
   npm install
   npm run dev        # http://localhost:5000  (or: npm start)
   ```

4. **Run the frontend** — from the project root: `npm run dev`.
   Vite proxies `/api/*` to `http://localhost:5000`, so no CORS setup is
   needed in development. (Shortcut from the root: `npm run backend`.)

---

## Response format

Every endpoint returns the same envelope:

```json
// success
{ "success": true, "message": "…", "data": { } }

// failure (validation, 404, 500)
{ "success": false, "message": "Validation failed", "errors": [ { "field": "amount", "message": "Amount must be greater than 0" } ] }
```

---

## Endpoints

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check |

### Auth (public)
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` → `{ user, token }` (password bcrypt-hashed, email unique) |
| POST | `/api/auth/login` | `{ email, password }` → `{ user, token }` |
| POST | `/api/auth/logout` | Stateless acknowledgement — client discards the token |
| GET | `/api/auth/me` | Current user (requires `Authorization: Bearer <token>`) |

**All other endpoints require `Authorization: Bearer <JWT>`** and are automatically
scoped to the authenticated user — every query filters by `user_id`, so users can
never read, modify, or delete another user's records (cross-user IDs return 404).

Tokens are signed with `JWT_SECRET` (env) and expire after `JWT_EXPIRES_IN` (default 7d).

**Test users** (seeded, password `password123`): `test1@example.com` (owns the original
data), `test2@example.com` (own sample set — use both to verify isolation).

### Expenses
| Method | Path | Description |
|---|---|---|
| GET | `/api/expenses` | List with pagination / search / filters / sorting |
| POST | `/api/expenses` | Create |
| GET | `/api/expenses/:id` | Get one |
| PUT | `/api/expenses/:id` | Update (partial fields allowed) |
| DELETE | `/api/expenses/:id` | Delete one |
| DELETE | `/api/expenses` | Bulk delete — body `{ "ids": [1,2,3] }` |

**GET `/api/expenses` query params:**
`page` (default 1) · `limit` (default 20, max 500) · `search` (matches title/notes, ILIKE) ·
`category` · `startDate` / `endDate` (YYYY-MM-DD) · `sortBy` (`expense_date|amount|created_at|title|category`) · `order` (`asc|desc`)

```bash
curl "http://localhost:5000/api/expenses?page=1&limit=10&category=Food&search=lunch&startDate=2026-06-01&sortBy=amount&order=desc"
```

**POST `/api/expenses` body:**
```json
{ "title": "Lunch at cafe", "amount": 250, "category": "Food", "expense_date": "2026-06-10", "notes": "with friends" }
```
Validation: `title` required (≤255), `amount` > 0, `category` required, `expense_date` valid ISO date.

**Response row:**
```json
{ "id": 1, "title": "Lunch at cafe", "amount": 250, "category": "Food", "expense_date": "2026-06-10", "notes": "with friends", "created_at": "…", "updated_at": "…" }
```

### Dashboard (all aggregation done in PostgreSQL)
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Totals, averages, category breakdown, recent 5, limits, savings, bills due today |
| GET | `/api/dashboard/charts` | 7-day daily trend, 6-month trend, category distribution with % |

**`/summary` response data:**
```json
{
  "totalExpenses": 3769, "todayExpenses": 400, "weekExpenses": 1870,
  "monthlyExpenses": 3769, "averageExpense": 471.13, "expenseCount": 8,
  "categoryBreakdown": [ { "category": "Bills", "total": 1240 } ],
  "recentTransactions": [ { "id": 1, "title": "…", "amount": 250, "…": "…" } ],
  "billsDueToday": 1,
  "limits": { "daily": 500, "weekly": 3000, "monthly": 12000 },
  "savings": { "total": 0 }
}
```

**`/charts` response data:**
```json
{
  "dailyTrend":   [ { "date": "2026-06-04", "total": 0 }, … 7 days ],
  "monthlyTrend": [ { "month": "2026-01", "total": 0 }, … 6 months ],
  "categoryDistribution": [ { "category": "Food", "total": 1070, "percentage": 28.4 } ]
}
```

### Reminders (bills)
| Method | Path | Description |
|---|---|---|
| GET | `/api/reminders` | List (each row includes computed `status`: `overdue` / `due_today` / `upcoming` / `paid`) |
| POST | `/api/reminders` | Create — `{ name, amount, due_date, repeat_cycle }` |
| GET | `/api/reminders/:id` | Get one |
| PUT | `/api/reminders/:id` | Update |
| POST | `/api/reminders/:id/pay` | Mark paid — sets `last_paid` and rolls `due_date` forward one cycle (daily/weekly/monthly/yearly) in SQL |
| DELETE | `/api/reminders/:id` | Delete |

### Settings
| Method | Path | Description |
|---|---|---|
| GET | `/api/settings/limits` | `{ daily, weekly, monthly }` |
| PUT | `/api/settings/limits` | Update any subset of the three limits |
| GET | `/api/settings/savings` | `{ total }` |
| PUT | `/api/settings/savings` | Set absolute total — `{ total }` |
| POST | `/api/settings/savings/add` | Increment — `{ amount }` |

### Payments — Razorpay Test Mode
| Method | Path | Description |
|---|---|---|
| POST | `/api/payments/create-order` | Create a Razorpay order + pending payment row — body `{ "amount": 500, "recipient_name": "…", "note": "…" }` → `{ orderId, amount, amountPaise, currency, keyId }` |
| POST | `/api/payments/verify` | Verify checkout result — body `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`. HMAC-SHA256 signature validation (constant-time compare); on success atomically records the transaction + expense and marks the payment `success` |
| POST | `/api/payments/mark-failed` | Record a cancelled/failed attempt — body `{ razorpay_order_id, reason }` |
| GET | `/api/payments/history?limit=50&status=success` | All Razorpay payment attempts (`pending` / `success` / `failed`) |
| GET | `/api/payments/:id` | Single payment attempt |
| GET | `/api/payments?limit=20` | Recent finance transactions (feeds the Recent Payments list) |
| POST | `/api/payments` | Legacy simulated payment (kept for compatibility; the UI now uses Razorpay) |

**Razorpay setup (test mode):**
1. Sign up / log in at https://dashboard.razorpay.com (free).
2. Make sure the dashboard is in **Test Mode** → Settings → API Keys → Generate Test Key.
3. Put the keys in `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. Restart the backend. Until keys are set, `create-order` returns a friendly 503.

**Test payment credentials (no real money moves):**
- **Card (success):** `4111 1111 1111 1111`, any future expiry, any CVV, any name. Indian test card: `5267 3181 8797 5449`.
- **UPI:** `success@razorpay` (succeeds) · `failure@razorpay` (fails). QR codes shown in test mode auto-simulate.
- **NetBanking / Wallets:** pick any bank/wallet — Razorpay shows a mock page with Success / Failure buttons.

**Security:** the secret key lives only in `backend/.env` (gitignored) and is used solely for order creation and HMAC signature verification on the server. The browser only ever sees the public `keyId`. Every attempt is stored in the `payments` table; on verified success the backend atomically inserts a `transactions` row + an `expenses` row, so the dashboard, analytics, and Recent Payments update automatically.

### Categories
| Method | Path | Description |
|---|---|---|
| GET | `/api/categories` | The 8 seeded categories with their colors |

---

## Frontend integration (already wired up)

- [src/api.js](../src/api.js) — fetch wrapper + camelCase↔snake_case mappers; every method returns the exact shapes the components were already using.
- [src/App.jsx](../src/App.jsx) — all `localStorage` (`load`/`save`, `pf_*` keys) removed:

| Old (localStorage) | New (API) |
|---|---|
| `load("pf_expenses")` + in-component math | `api.getDashboardSummary()` / `api.getDashboardCharts()` |
| `save("pf_expenses", […])` in `addExpense` | `api.createExpense(form)` |
| `delExpense` filter + save | `api.deleteExpense(id)` |
| client-side category filter | `api.listExpenses({ category })` (SQL `WHERE`) |
| `load/save("pf_limits")` | `api.getLimits()` / `api.updateLimits()` |
| `load/save("pf_savings")` | `api.getSavings()` / `api.addSavings(amount)` |
| `load/save("pf_reminders")` + date math in `markPaid` | `api.payReminder(id)` (due-date roll in SQL) |
| `load/save("pf_tx_history")` in `confirmPay` | `api.createPayment(…)` (tx + expense in one DB transaction) |
| reminder grouping by date comparison | backend-computed `status` field |

- [vite.config.js](../vite.config.js) — dev proxy `/api → http://localhost:5000`.
- For production, set `VITE_API_URL` to the deployed API origin and serve `dist/`.
