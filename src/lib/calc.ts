import { getDaysInMonth } from "date-fns";
import { monthKeyToDate, shiftMonth } from "./date";
import { toKurus } from "./format";
import type { Category, Period, Transaction, TransactionType } from "./types";

/* All amounts are integer cents. */

export interface DateRange {
  /** inclusive, "2026-09-01" */
  start: string;
  /** inclusive, "2026-09-30" */
  end: string;
}

export function periodMonths(period: Period): number | null {
  if (period.mode === "month") return 1;
  if (period.mode === "last3") return 3;
  return null;
}

export function periodRange(period: Period): DateRange | null {
  const months = periodMonths(period);
  if (months === null) return null;
  const startKey = shiftMonth(period.month, -(months - 1));
  const lastDay = getDaysInMonth(monthKeyToDate(period.month));
  return { start: `${startKey}-01`, end: `${period.month}-${String(lastDay).padStart(2, "0")}` };
}

/** The preceding period of equal length, for comparison. None for "All time". */
export function previousPeriod(period: Period): Period | null {
  const months = periodMonths(period);
  if (months === null) return null;
  return { mode: period.mode, month: shiftMonth(period.month, -months) };
}

export function filterByPeriod(transactions: Transaction[], period: Period): Transaction[] {
  const range = periodRange(period);
  if (!range) return transactions;
  return transactions.filter((t) => t.date >= range.start && t.date <= range.end);
}

export interface Totals {
  income: number;
  expense: number;
  net: number;
}

export function totalsOf(transactions: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += toKurus(t.amount);
    else expense += toKurus(t.amount);
  }
  return { income, expense, net: income - expense };
}

/** Relative change vs. the previous value (0.12 = 12%). Not comparable when previous is 0. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

export interface CategoryTotal {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  /** cents */
  total: number;
  /** share between 0 and 1 */
  share: number;
  count: number;
}

export function categoryTotals(
  transactions: Transaction[],
  type: TransactionType,
  categories: Record<string, Category>,
): CategoryTotal[] {
  const sums = new Map<string, { total: number; count: number }>();
  let grand = 0;
  for (const t of transactions) {
    if (t.type !== type) continue;
    const k = toKurus(t.amount);
    const entry = sums.get(t.categoryId) ?? { total: 0, count: 0 };
    entry.total += k;
    entry.count += 1;
    sums.set(t.categoryId, entry);
    grand += k;
  }
  const result: CategoryTotal[] = [];
  for (const [categoryId, { total, count }] of sums) {
    const category = categories[categoryId];
    result.push({
      categoryId,
      name: category?.name ?? "Uncategorized",
      color: category?.color ?? "#5F6B73",
      icon: category?.icon ?? "circle",
      total,
      count,
      share: grand === 0 ? 0 : total / grand,
    });
  }
  return result.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "tr"));
}

export const OTHER_SLICE_ID = "__other__";
export const OTHER_THRESHOLD = 0.03;

export interface DonutSlice extends CategoryTotal {
  isOther?: boolean;
  children?: CategoryTotal[];
}

/**
 * Collects categories whose share is below the threshold into a single "Other items" slice.
 * A single small category is left as is; grouping it would add nothing.
 */
export function groupSmallCategories(
  totals: CategoryTotal[],
  threshold: number = OTHER_THRESHOLD,
): DonutSlice[] {
  const big = totals.filter((t) => t.share >= threshold);
  const small = totals.filter((t) => t.share < threshold);
  if (small.length < 2) return totals;
  const other: DonutSlice = {
    categoryId: OTHER_SLICE_ID,
    name: "Other items",
    color: "var(--other-slice)",
    icon: "ellipsis",
    total: small.reduce((s, t) => s + t.total, 0),
    share: small.reduce((s, t) => s + t.share, 0),
    count: small.reduce((s, t) => s + t.count, 0),
    isOther: true,
    children: small,
  };
  return [...big, other];
}

export interface TrendPoint {
  /** "2026-09" */
  month: string;
  income: number;
  expense: number;
}

/** Income/expense totals for the `count` months ending with `endMonth` (oldest first). */
export function monthlyTrend(transactions: Transaction[], endMonth: string, count = 6): TrendPoint[] {
  const points: TrendPoint[] = [];
  const index = new Map<string, TrendPoint>();
  for (let i = count - 1; i >= 0; i--) {
    const point: TrendPoint = { month: shiftMonth(endMonth, -i), income: 0, expense: 0 };
    points.push(point);
    index.set(point.month, point);
  }
  for (const t of transactions) {
    const point = index.get(t.date.slice(0, 7));
    if (!point) continue;
    point[t.type] += toKurus(t.amount);
  }
  return points;
}

export interface DayGroup {
  date: string;
  transactions: Transaction[];
  /** net for the day, cents */
  net: number;
}

/** Groups by date (newest first); within a day the most recently added comes first. */
export function groupByDate(transactions: Transaction[]): DayGroup[] {
  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
  const groups: DayGroup[] = [];
  for (const t of sorted) {
    let group = groups[groups.length - 1];
    if (!group || group.date !== t.date) {
      group = { date: t.date, transactions: [], net: 0 };
      groups.push(group);
    }
    group.transactions.push(t);
    group.net += t.type === "income" ? toKurus(t.amount) : -toKurus(t.amount);
  }
  return groups;
}
