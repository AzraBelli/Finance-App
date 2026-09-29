# Finance Tracker

A personal finance dashboard that shows income and expenses by category in a donut chart. It runs entirely in the browser.
Original brief: [FINANS_TAKIP_SPEC.md](FINANS_TAKIP_SPEC.md).

## Setup

Requires Node.js 20+.

```bash
npm install        # or: pnpm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm test` | Vitest unit tests (calculations and formatting) |
| `npm run build` | Type check + production build (`dist/`) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Usage

- The app starts empty. Everything you add is saved in `localStorage`.
- **Add a transaction:** the button at the top right, the `+` in the mobile bottom bar, or press `N`.
- **Edit:** click a row in the list. **Delete:** the row's `⋯` menu, "Delete" in the form, or `Delete` while a row is focused. The toast's "Undo" brings it back.
- **Filter:** click a category in the legend to filter the list. Search and type/category filters sit above the list.
- **Amounts:** entered in en-US format, e.g. `1,250.50`.
- **Settings:** currency (display only, no conversion), theme, JSON export, delete all data.

## Architecture

```
src/
  app/            App, period header, sidebar / mobile bottom nav
  components/
    ui/           shadcn/ui + 21st.dev Segmented Control
    dashboard/    SummaryStrip, CategoryBreakdown, CategoryDonut, CategoryLegend, TrendChart
    transactions/ TransactionList, TransactionRow, TransactionForm, TransactionFormHost
    settings/     SettingsPanel
  data/           categories.ts
  lib/            calc.ts (pure calculations), format.ts, date.ts, hooks.ts
  repositories/   TransactionRepository interface + localStorage implementation
  store/          Zustand stores, usePeriodData
  styles/         globals.css (theme tokens)
```

- **Money:** amounts are converted to integer cents before any arithmetic and divided by 100 only for display.
- **Moving to an API:** implement `TransactionRepository` as an `ApiTransactionRepository` (ASP.NET Core `/api/transactions`) and pass it to `createFinanceStore(...)` in [useFinanceStore.ts](src/store/useFinanceStore.ts). The UI does not change.
- **React 18 note:** current shadcn components are generated for React 19 (ref is a plain prop). [with-ref.ts](src/lib/with-ref.ts) wraps them with `forwardRef`.
