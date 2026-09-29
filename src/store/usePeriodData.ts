import { useMemo } from "react";
import { CATEGORY_BY_ID } from "@/data/categories";
import {
  categoryTotals,
  filterByPeriod,
  groupSmallCategories,
  percentChange,
  periodRange,
  previousPeriod,
  totalsOf,
} from "@/lib/calc";
import { currentMonthKey, formatMonthLabel, formatMonthRange, shiftMonth } from "@/lib/date";
import type { Period, TransactionType } from "@/lib/types";
import { useFinanceStore, useUiStore } from "./useFinanceStore";

export function periodLabel(period: Period): string {
  if (period.mode === "all") return "All time";
  if (period.mode === "last3") return formatMonthRange(shiftMonth(period.month, -2), period.month);
  return formatMonthLabel(period.month);
}

export function comparisonLabel(period: Period): string | null {
  if (period.mode === "month") return period.month === currentMonthKey() ? "vs last month" : "vs previous month";
  if (period.mode === "last3") return "vs previous 3 months";
  return null;
}

/** Everything computed for the selected period; components read only this. */
export function usePeriodData() {
  const transactions = useFinanceStore((s) => s.transactions);
  const period = useUiStore((s) => s.period);

  return useMemo(() => {
    const inPeriod = filterByPeriod(transactions, period);
    const totals = totalsOf(inPeriod);
    const prev = previousPeriod(period);
    const prevTotals = prev ? totalsOf(filterByPeriod(transactions, prev)) : null;
    const change = prevTotals
      ? {
          income: percentChange(totals.income, prevTotals.income),
          expense: percentChange(totals.expense, prevTotals.expense),
          net: percentChange(totals.net, prevTotals.net),
        }
      : null;
    const breakdown = (type: TransactionType) =>
      groupSmallCategories(categoryTotals(inPeriod, type, CATEGORY_BY_ID));

    return {
      period,
      range: periodRange(period),
      label: periodLabel(period),
      transactions: inPeriod,
      totals,
      change,
      counts: {
        income: inPeriod.filter((t) => t.type === "income").length,
        expense: inPeriod.filter((t) => t.type === "expense").length,
      },
      slices: { expense: breakdown("expense"), income: breakdown("income") },
    };
  }, [transactions, period]);
}
