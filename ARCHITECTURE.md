# Pocket-Friendly: Architecture Report

## 1. Project Overview

**Project Name:** Pocket-Friendly
**Type:** Single Page Application (SPA) - Personal Finance Manager
**Tech Stack:** React 19 + Vite 8 + CSS
**Data Storage:** Browser localStorage

---

## 2. High-Level Architecture

```
+-------------------------------------------------------------+
|                        BROWSER (Client)                     |
+-------------------------------------------------------------+
|  +-------------------------------------------------------+  |
|  |                    React Application                  |  |
|  |  +--------------------------------------------------+ |  |
|  |  |                 App Component                    | |  |
|  |  |  (Main Shell - Header, Nav, Tab Routing)         | |  |
|  |  +--------------------------------------------------+ |  |
|  |                         |                             |  |
|  |         +--------------+--------------+               |  |
|  |         ▼              ▼              ▼               |  |
|  |   +----------+   +----------+   +----------+          |  |
|  |   |Dashboard |   |Expenses  |   |Reminders |          |  |
|  |   |Component |   |Component |   |Component |          |  |
|  |   +----------+   +----------+   +----------+          |  |
|  |         |              |              |               |  |
|  |         +--------------+--------------+               |  |
|  |                        ▼                              |  |
|  |              +-----------------+                      |  |
|  |              |  localStorage    |                     |  |
|  |              |  (Data Layer)    |                     |  |
|  |              +-----------------+                      |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

---

## 3. Component Architecture

```
App (Root)
+-- Header
+-- TabRouter (Conditional Rendering)
|   +-- Dashboard
|   |   +-- StatCards (Today/Week/Month/Savings)
|   |   +-- BarChart (Last 7 Days)
|   |   +-- CategoryBreakdown
|   |   +-- RecentExpenses
|   +-- Expenses
|   |   +-- MonthlyProgress
|   |   +-- SavingsInput
|   |   +-- CategoryFilter
|   |   +-- ExpenseList
|   |   +-- Modals
|   |       +-- AddExpenseModal
|   |       +-- LimitsModal
|   +-- Reminders
|   |   +-- ReminderGroups (Overdue/Due/Upcoming/Paid)
|   |   +-- AddReminderModal
|   +-- Calculator
|   |   +-- Display
|   |   +-- ButtonGrid
|   |   +-- History
|   +-- Payment
|       +-- UPIForm / CardForm
|       +-- ConfirmDialog
|       +-- SuccessScreen + TxHistory
+-- BottomNavigation
```

---

## 4. Data Flow Diagram

```
+-----------------------------------------------------------------------------+
|                              DATA FLOW                                      |
+-----------------------------------------------------------------------------+

  USER ACTION
       |
       ▼
  +-------------+     +-------------+     +-------------+
  |   Form/UI   |---->|   Handler   |---->|  useState   |
  |  Input      |     |  Function   |     |  (React)    |
  +-------------+     +-------------+     +------+------+
                                                 |
                                                 ▼
                                         +-------------+
                                         | save()      |
                                         | function   |
                                         +------+------+
                                                |
                                                ▼
                                        +----------------+
                                        | localStorage  |
                                        | (Browser DB)  |
                                        +----------------+
                                                |
                                                ▼
                                        +----------------+
                                        | load()         |
                                        | function       |
                                        +------+---------+
                                               |
                                               ▼
                                        +-------------+
                                        |  useState   |<-- Re-render
                                        |  (State)    |    on change
                                        +------+------+
                                               |
                                               ▼
                                        +-------------+
                                        |   JSX UI    |
                                        |   Render    |
                                        +-------------+
```

---

## 5. Data Models (localStorage Keys)

| Key | Type | Description |
|-----|------|-------------|
| `pf_expenses` | Array | All expense records |
| `pf_limits` | Object | Daily/Weekly/Monthly budget limits |
| `pf_savings` | Number | Total savings amount |
| `pf_reminders` | Array | Bill reminders with recurrence |
| `pf_tx_history` | Array | Payment transaction history |

### Expense Object Structure
```javascript
{
  id: Number,           // timestamp
  amount: Number,      // expense amount
  category: String,     // Food/Transport/Shopping/Bills/Health/Entertainment/Savings/Other
  note: String,        // optional note
  date: String         // ISO date "YYYY-MM-DD"
}
```

### Reminder Object Structure
```javascript
{
  id: Number,
  name: String,
  amount: Number,
  dueDate: String,
  repeat: "daily" | "weekly" | "monthly" | "yearly",
  paid: Boolean,
  lastPaid: String
}
```

---

## 6. Key Modules & Functions

### Helper Functions (Lines 4-14 in App.jsx)

| Function | Purpose |
|----------|---------|
| `load(key, fallback)` | Load from localStorage with JSON parse |
| `save(key, val)` | Save to localStorage with JSON stringify |
| `todayStr()` | Get current date as "YYYY-MM-DD" |
| `weekStart()` | Get start of current week (Sunday) |
| `monthStr()` | Get current month "YYYY-MM" |
| `CATS` | Category list constant |
| `COLORS` | Category color mapping |
| `barCol(p)` | Color based on percentage threshold |
| `pct(v, m)` | Calculate percentage with cap at 100% |

---

## 7. State Management

- **Single Component State:** All state in `App.jsx` distributed via `useState`
- **Persistent Data:** Loaded via `load()` on component mount
- **Updates:** Written via `save()` on every mutation

```
+-----------------------------------------------------+
|              React Component Lifecycle              |
+-----------------------------------------------------+
|  Mount                                              |
|    |                                                |
|    ▼                                                |
|  load() ──▶ useState initial value                  |
|    |                                                |
|    ▼                                                |
|  UI Render                                          |
|    |                                                |
|    ▼                                                |
|  User Action ──▶ Handler Function                   |
|    |                                                |
|    ▼                                                |
|  setState() ──▶ Re-render UI                        |
|    |                                                |
|    ▼                                                |
|  save() ──▶ localStorage persistence                |
+-----------------------------------------------------+
```

---

## 8. UI/UX Design System

### Color Palette

| Variable | Hex | Usage |
|----------|-----|-------|
| `--black` | #1a1a1a | Borders, text |
| `--white` | #FDFAF4 | Card backgrounds |
| `--yellow` | #FFE600 | Primary accent |
| `--blue` | #4169FF | Actions |
| `--green` | #00C896 | Success/Savings |
| `--orange` | #FF7A2F | Warnings (70-90%) |
| `--red` | #FF3B3B | Danger/Over 90% |

### Typography

- **Display:** Bebas Neue (headings)
- **Body:** Space Grotesk (UI text)

---

## 9. Module Dependency Graph

```
App.jsx (594 lines)
+-- Line 1-2: React imports
+-- Line 4-14: Helper utilities
+-- Line 18-66: App component + Tab routing
+-- Line 70-181: Dashboard component
+-- Line 185-312: Expenses + LimitsModal
+-- Line 316-403: Reminders component
+-- Line 407-476: Calculator component
+-- Line 480-594: Payment component
```

---

## 10. Build & Development

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint validation |
| `npm run preview` | Preview production build |

---

## 11. Summary

Your **Pocket-Friendly** app is a well-architected single-file React SPA with:

- **5 core features** in a tabbed interface
- **Client-side persistence** via localStorage
- **Responsive design** with mobile-first approach
- **Visual design system** using CSS custom properties
- **No external dependencies** beyond React

The architecture follows a **component-based** pattern with centralized state management and persistence layer. The data flows unidirectionally: User Input → Handler → State → localStorage → Re-render.