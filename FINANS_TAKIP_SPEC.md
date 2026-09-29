# Personal Finance Dashboard — Claude Code Task Brief

> **Changes since the original brief** (at the owner's request):
> - The app **starts empty**: sample data and "Restore sample data" were removed (§1, §5, §6.7).
> - The default currency is **USD** (TRY and EUR remain selectable).

## 1. Goal

Build a personal finance dashboard that runs **entirely locally**, where the user enters income and expenses and sees them broken down by category in a **pie (donut) chart**.

Scope of this phase:

- **No** backend, database or external service. ~~The app opens with ready-made **dummy (sample) data**.~~ *Changed: the app starts empty.*
- The user can add, edit and delete income/expenses; the chart updates instantly.
- Data is stored in the browser with `localStorage` (so it survives a page refresh). ~~Include a "Restore sample data" option.~~ *Changed: removed.*
- UI quality is the main priority of this work: a careful, consistent and distinctive design.

It will later connect to an ASP.NET Core Web API. So hide data access behind an interface (repository), so that switching to the API only requires changing that layer.

---

## 2. Tech Stack

| Area | Choice |
|---|---|
| Build | Vite + React 18 + TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Dialog, Sheet, Select, Input, Button, Tabs, Toast/Sonner, Tooltip, Popover, Calendar) |
| Charts | Recharts (PieChart / donut, BarChart) |
| State | Zustand (+ `persist` middleware → localStorage) |
| Forms | react-hook-form + zod |
| Dates | date-fns (`en-US` locale) |
| Icons | lucide-react |
| Testing | Vitest + React Testing Library (at least for the calculation functions) |

Package manager: `pnpm` (`npm` if unavailable).

---

## 3. MCP Setup

**MCP:** 21st.dev (React/shadcn component catalog). Added in local scope (`~/.claude.json`, this project):

```
claude mcp add --transport http 21st https://21st.dev/api/mcp --header "x-api-key: <21ST_API_KEY>"
```

> The API key is never written to the repo. On the free plan `get_component` is limited to 2 code retrievals per day; `search` and `get_theme` are free.
> Components used: **Pie Chart** (arihantcodes, Recharts donut patterns → `CategoryDonut.tsx`) and
> **Segmented Control** (ddoemonn → `components/ui/segmented-control.tsx`).

If the MCP is a UI component library (e.g. the shadcn MCP), add components through the MCP instead of writing them by hand, and customize the theme file with the design tokens below. If work has to start before the MCP details arrive, do a standard setup with the shadcn CLI.

---

## 4. Data Model

```ts
export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;          // "Groceries", "Rent", "Salary"...
  type: TransactionType;
  color: string;         // color used in the chart (hex)
  icon: string;          // lucide icon name
}

export interface Transaction {
  id: string;            // crypto.randomUUID()
  type: TransactionType;
  amount: number;        // always positive, cent precision (2 decimals)
  categoryId: string;
  date: string;          // ISO "2026-09-14"
  note?: string;
  createdAt: string;
}
```

Currency: **USD** by default, formatted with `Intl.NumberFormat("en-US", { style: "currency", currency })`. The currency can be switched in settings between USD / EUR / TRY (display only, no exchange-rate conversion).

### Repository layer

```ts
export interface TransactionRepository {
  list(): Promise<Transaction[]>;
  create(input: Omit<Transaction, "id" | "createdAt">): Promise<Transaction>;
  update(id: string, input: Partial<Transaction>): Promise<Transaction>;
  remove(id: string): Promise<void>;
}
```

For now, write a `LocalStorageTransactionRepository`. An `ApiTransactionRepository` (ASP.NET Core `/api/transactions`) will be added later; the UI code must not change.

---

## 5. Sample (Dummy) Data

> *Changed: removed. The app starts with no transactions. The original requirement is kept below for reference.*

~~Create it in `src/data/seed.ts`:~~

**Expense categories (8):** Rent, Groceries, Bills, Transport, Dining, Entertainment, Health, Shopping
**Income categories (4):** Salary, Freelance, Investment, Other

~~**Transactions:** ~45 transactions spread over the last 3 months, with realistic amounts:~~
- ~~Salary once a month (~65,000), Freelance 1–2 times a month (5,000–15,000)~~
- ~~Rent once a month (~22,000), Groceries 1–2 times a week (800–2,500)~~
- ~~Bills: 3 items a month (electricity, internet, water); the rest scattered~~
- ~~Short, natural notes: "Weekly groceries", "October rent", "Logo project"~~

~~Data generation must be deterministic (fixed seed) so it looks the same on every launch.~~

The categories now live in `src/data/categories.ts`.

---

## 6. Screens and Features

Single-page dashboard (SPA). A narrow sidebar on the left on desktop, bottom navigation on mobile.

### 6.1 Top — Period picker
- Month picker (← September 2026 →) and quick filters "This month / Last 3 months / All time".
- The whole dashboard is calculated for the selected period.

### 6.2 Summary
Three values: **Total income**, **Total expenses**, **Net balance**. If the net is negative it is shown in the expense color. A small line shows the percentage change vs. the previous period.

### 6.3 Pie chart (the main element of the page)
- Donut chart with the selected period's total in the center.
- An **Expenses / Income** tab switch on top; the chart shows the category breakdown for that type.
- Hovering (or tapping) a slice pops it out slightly, and the center text changes to that category's name, amount and percentage.
- A category legend next to the chart (below it on mobile): color, name, amount, percentage and a thin horizontal share bar. Clicking a legend row filters the transaction list by that category.
- Categories under 3% are collected into an "Other" slice (expandable in the legend). *In the app: "Other items", since there is already an income category named "Other".*
- Empty state: a gray ring + "No expenses in this period. Add your first expense." and an add button.

### 6.4 Monthly trend (secondary)
Income vs. expenses for the last 6 months as a grouped bar chart. Keep it simple; it must not compete with the pie chart.

### 6.5 Transaction list
- Grouped by date ("Today", "Yesterday", "Friday, September 12").
- Each row: category icon (on a soft background in the category color), category name, note, amount (income `+`, expense `−`).
- Search (within notes), type filter, category filter.
- Clicking a row opens editing; delete via swipe or menu. Deleting shows a toast with "Undo".

### 6.6 Add / edit transaction
- A fixed **"Add transaction"** button at the top right and on mobile. Keyboard shortcut: `N`.
- Dialog on desktop, a Sheet sliding up from the bottom on mobile.
- Fields: Type (Expense/Income segmented control), Amount (large, focused; en-US format, e.g. `1,250.50`), Category (filtered by type, grid with icons), Date (defaults to today), Note (optional).
- zod validation: amount > 0, category required, date can't be in the future. Error messages are clear ("Amount must be greater than zero").
- After saving, a toast: "Expense added" / "Income added". The chart updates with a smooth transition.

### 6.7 Settings (a small panel)
- Currency selection
- Light / dark theme
- ~~"Restore sample data" and~~ "Delete all data" (with a confirmation dialog) — *"Restore sample data" removed*
- Export data as JSON

---

## 7. Design System

Overall feel: calm and trustworthy, far from the coldness of a "banking app" but not toy-like either. The **pie chart** is the one place where the design is bold; everything else is plain and disciplined.

### Colors (light theme)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#EEF1EC` | Page background (pale sage gray) |
| `--surface` | `#FFFFFF` | Panels |
| `--ink` | `#1E2A28` | Main text (dark greenish) |
| `--muted` | `#6B7A76` | Secondary text |
| `--line` | `#D9E0DB` | Dividers, borders |
| `--income` | `#2E7D5B` | Income |
| `--expense` | `#C4533A` | Expense |
| `--accent` | `#3C5A99` | Buttons, focus ring, selected state |

**Dark theme:** `--bg #121A19`, `--surface #1A2422`, `--ink #E6ECE9`, `--muted #92A29D`, `--line #2A3633`; lighten the income/expense/accent colors by ~15% so they stay legible on the dark background.

**Category palette** (chart slices; distinguishable from each other, balanced saturation):
`#3C5A99` `#C4533A` `#D9A441` `#2E7D5B` `#7B5EA7` `#4A9BB0` `#B5657E` `#8A8F5C` `#5F6B73` `#C98A5B`

Colors must not carry meaning on their own: income/expense are always also distinguished by a `+`/`−` sign and a label.

### Typography
- Headings and large amounts: **Bricolage Grotesque** (600–700)
- Body and UI: **Figtree** (400–600)
- `font-variant-numeric: tabular-nums` on all amounts, so digits line up vertically.
- Scale: 12 / 14 / 16 / 20 / 28 / 40 px. The main balance is 40px.
- No uppercase labels and no small "eyebrow" labels above headings. Use sentence case.

### Layout and form
- Desktop grid: left sidebar (72px, icons) + content (max 1280px). The pie chart section takes the widest area of the content.

```
┌────┬──────────────────────────────────────────────────┐
│    │  September 2026  ‹ ›   [This month][3 months] [+] │
│ ◉  ├──────────────────────────────────────────────────┤
│ ≡  │  Income 70,000   Expenses 41,250   Net +28,750   │
│ ⚙  ├─────────────────────────────┬────────────────────┤
│    │                             │ ● Rent       53%   │
│    │         ( DONUT )           │ ● Groceries  18%   │
│    │     $41,250 expenses        │ ● Bills      11%   │
│    │                             │ ...                │
│    ├─────────────────────────────┴────────────────────┤
│    │  Transactions (grouped list)  │  6-month trend    │
└────┴──────────────────────────────────────────────────┘
```

- Corner radii vary by hierarchy: main panels 20px, inner items 12px, chips fully round. Don't give everything the same radius.
- Prefer background/surface contrast and thin border lines over shadows. No decorative gradients.
- Spacing scale in multiples of 4px.

### Motion
- One "special moment": on first page load, the donut's slices fill clockwise (~700ms).
- All other animations only respond to user actions: dialog opening, slice hover, toast.
- If `prefers-reduced-motion` is on, turn all animations off.

### Copy
- Plain, clear English. Buttons say what they do: "Add transaction", "Save", "Delete". The same action has the same name everywhere.

---

## 8. Quality Requirements

- Responsive: from 360px mobile to wide desktop without breaking.
- Accessibility: visible keyboard focus, every interaction doable by keyboard, an accessible table/legend alternative next to the chart, WCAG AA contrast.
- Money calculations are done in integer cents (no float errors) and divided only for display.
- Calculation functions (`src/lib/calc.ts`: period filter, category totals, "Other" grouping, change vs. previous period) are pure functions and tested with Vitest.
- ESLint + Prettier, no `any` in TypeScript.

---

## 9. Folder Structure

```
src/
  app/            App.tsx, layout, routing (if needed)
  components/
    ui/           shadcn components
    dashboard/    SummaryStrip, CategoryDonut, CategoryLegend, TrendChart
    transactions/ TransactionList, TransactionForm, TransactionRow
    settings/     SettingsPanel
  data/           categories.ts (seed.ts removed)
  lib/            calc.ts, format.ts, date.ts
  repositories/   TransactionRepository.ts, LocalStorageTransactionRepository.ts
  store/          useFinanceStore.ts
  styles/         globals.css (theme tokens)
```

---

## 10. Order of Work

1. Create the project, install Tailwind + shadcn (with the MCP if its details have arrived).
2. Set up the theme tokens and fonts; light/dark theme must work.
3. Write the types, ~~seed data,~~ repository and store.
4. Write the `calc.ts` functions and their tests.
5. Build and polish the pie chart + legend section (most of the time should go here).
6. Summary strip, transaction list, add/edit form.
7. Trend chart and settings.
8. Mobile layout, accessibility and reduced-motion checks.
9. Open it in the browser and review every screen; fix anything that stands out.

**Running:** it must open at `http://localhost:5173` with `pnpm install && pnpm dev`. Add a short `README.md` at the root describing setup and usage.

---

## 11. Acceptance Criteria

- [ ] ~~On first launch the app shows a dashboard filled with sample data.~~ *Changed: on first launch the app shows an empty dashboard with empty states.*
- [ ] The Expenses/Income tab switches the pie chart to the correct category breakdown.
- [ ] Adding a transaction updates the chart, summary and list instantly.
- [ ] Editing and deleting (with undo) work.
- [ ] Data persists across a page refresh. ~~"Restore sample data" works.~~
- [ ] The period picker filters all calculations correctly.
- [ ] It looks right on mobile and in the dark theme.
- [ ] `pnpm test` passes, `pnpm build` has no errors.
