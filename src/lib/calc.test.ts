import { describe, expect, it } from "vitest";
import { CATEGORY_BY_ID } from "@/data/categories";
import {
  OTHER_SLICE_ID,
  categoryTotals,
  filterByPeriod,
  groupByDate,
  groupSmallCategories,
  monthlyTrend,
  percentChange,
  periodRange,
  previousPeriod,
  totalsOf,
  type CategoryTotal,
} from "./calc";
import type { Transaction } from "./types";

let seq = 0;
function tx(partial: Partial<Transaction> & Pick<Transaction, "amount" | "date">): Transaction {
  seq++;
  return {
    id: `t${seq}`,
    type: "expense",
    categoryId: "groceries",
    createdAt: `${partial.date}T10:00:${String(seq % 60).padStart(2, "0")}.000Z`,
    ...partial,
  };
}

describe("periodRange", () => {
  it("gives the first and last day for a single month", () => {
    expect(periodRange({ mode: "month", month: "2026-09" })).toEqual({ start: "2026-09-01", end: "2026-09-30" });
    expect(periodRange({ mode: "month", month: "2028-02" })).toEqual({ start: "2028-02-01", end: "2028-02-29" });
  });

  it("last 3 months ends with the selected month and crosses years", () => {
    expect(periodRange({ mode: "last3", month: "2026-01" })).toEqual({ start: "2025-11-01", end: "2026-01-31" });
  });

  it("has no range for all time", () => {
    expect(periodRange({ mode: "all", month: "2026-09" })).toBeNull();
  });
});

describe("previousPeriod", () => {
  it("gives the preceding period of equal length", () => {
    expect(previousPeriod({ mode: "month", month: "2026-01" })).toEqual({ mode: "month", month: "2025-12" });
    expect(previousPeriod({ mode: "last3", month: "2026-09" })).toEqual({ mode: "last3", month: "2026-06" });
    expect(previousPeriod({ mode: "all", month: "2026-09" })).toBeNull();
  });
});

describe("filterByPeriod", () => {
  const list = [
    tx({ amount: 1, date: "2026-08-31" }),
    tx({ amount: 1, date: "2026-09-01" }),
    tx({ amount: 1, date: "2026-09-30" }),
    tx({ amount: 1, date: "2026-10-01" }),
    tx({ amount: 1, date: "2026-07-01" }),
  ];

  it("includes month boundaries", () => {
    const dates = filterByPeriod(list, { mode: "month", month: "2026-09" }).map((t) => t.date);
    expect(dates).toEqual(["2026-09-01", "2026-09-30"]);
  });

  it("last 3 months", () => {
    expect(filterByPeriod(list, { mode: "last3", month: "2026-09" })).toHaveLength(4);
  });

  it("all time returns everything", () => {
    expect(filterByPeriod(list, { mode: "all", month: "2026-09" })).toHaveLength(5);
  });
});

describe("totalsOf", () => {
  it("sums in cents without float errors", () => {
    const totals = totalsOf([
      tx({ type: "expense", amount: 0.1, date: "2026-09-01" }),
      tx({ type: "expense", amount: 0.2, date: "2026-09-01" }),
      tx({ type: "income", amount: 100.3, date: "2026-09-01" }),
    ]);
    expect(totals).toEqual({ income: 10030, expense: 30, net: 10000 });
  });

  it("returns zeros for an empty list", () => {
    expect(totalsOf([])).toEqual({ income: 0, expense: 0, net: 0 });
  });
});

describe("percentChange", () => {
  it("gives increase and decrease as a ratio", () => {
    expect(percentChange(12000, 10000)).toBeCloseTo(0.2);
    expect(percentChange(5000, 10000)).toBeCloseTo(-0.5);
  });

  it("null when the previous value is zero", () => {
    expect(percentChange(5000, 0)).toBeNull();
  });

  it("keeps direction with a negative previous value", () => {
    // Net went from −100 to +100: an improvement, a positive change
    expect(percentChange(100, -100)).toBeCloseTo(2);
  });
});

describe("categoryTotals", () => {
  const list = [
    tx({ categoryId: "rent", amount: 22000, date: "2026-09-03" }),
    tx({ categoryId: "groceries", amount: 1250.5, date: "2026-09-04" }),
    tx({ categoryId: "groceries", amount: 749.5, date: "2026-09-10" }),
    tx({ type: "income", categoryId: "salary", amount: 65000, date: "2026-09-01" }),
  ];

  it("sums only the requested type, largest first", () => {
    const totals = categoryTotals(list, "expense", CATEGORY_BY_ID);
    expect(totals.map((t) => [t.categoryId, t.total, t.count])).toEqual([
      ["rent", 2200000, 1],
      ["groceries", 200000, 2],
    ]);
    expect(totals[0].name).toBe("Rent");
    expect(totals.reduce((s, t) => s + t.share, 0)).toBeCloseTo(1);
    expect(totals[1].share).toBeCloseTo(200000 / 2400000);
  });

  it("shows an unknown category as 'Uncategorized'", () => {
    const totals = categoryTotals([tx({ categoryId: "yok", amount: 10, date: "2026-09-01" })], "expense", CATEGORY_BY_ID);
    expect(totals[0].name).toBe("Uncategorized");
  });
});

describe("groupSmallCategories", () => {
  const make = (id: string, share: number): CategoryTotal => ({
    categoryId: id,
    name: id,
    color: "#000",
    icon: "x",
    total: Math.round(share * 10000),
    share,
    count: 1,
  });

  it("collects categories under 3% into one slice", () => {
    const slices = groupSmallCategories([make("a", 0.9), make("b", 0.05), make("c", 0.029), make("d", 0.021)]);
    expect(slices.map((s) => s.categoryId)).toEqual(["a", "b", OTHER_SLICE_ID]);
    const other = slices[2];
    expect(other.isOther).toBe(true);
    expect(other.children?.map((c) => c.categoryId)).toEqual(["c", "d"]);
    expect(other.total).toBe(290 + 210);
    expect(other.share).toBeCloseTo(0.05);
  });

  it("a category at exactly 3% stays separate", () => {
    const slices = groupSmallCategories([make("a", 0.94), make("b", 0.03), make("c", 0.02), make("d", 0.01)]);
    expect(slices.map((s) => s.categoryId)).toEqual(["a", "b", OTHER_SLICE_ID]);
  });

  it("does not group a single small category", () => {
    const input = [make("a", 0.98), make("b", 0.02)];
    expect(groupSmallCategories(input)).toEqual(input);
  });
});

describe("monthlyTrend", () => {
  it("gives the last 6 months oldest first, empty months as zero", () => {
    const trend = monthlyTrend(
      [
        tx({ type: "income", amount: 100, date: "2026-09-01" }),
        tx({ type: "expense", amount: 40.25, date: "2026-09-15" }),
        tx({ type: "expense", amount: 10, date: "2026-05-02" }),
        tx({ type: "expense", amount: 999, date: "2026-03-31" }), // outside the window
      ],
      "2026-09",
    );
    expect(trend.map((p) => p.month)).toEqual(["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]);
    expect(trend[5]).toEqual({ month: "2026-09", income: 10000, expense: 4025 });
    expect(trend[1].expense).toBe(1000);
    expect(trend[0].expense).toBe(0);
  });
});

describe("groupByDate", () => {
  it("groups by day newest first and computes the daily net", () => {
    const groups = groupByDate([
      tx({ amount: 50, date: "2026-09-10" }),
      tx({ type: "income", amount: 200, date: "2026-09-12" }),
      tx({ amount: 30, date: "2026-09-12" }),
    ]);
    expect(groups.map((g) => g.date)).toEqual(["2026-09-12", "2026-09-10"]);
    expect(groups[0].net).toBe(17000);
    expect(groups[1].net).toBe(-5000);
  });
});
