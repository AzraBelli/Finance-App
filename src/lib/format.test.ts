import { describe, expect, it } from "vitest";
import { countLabel, formatChange, formatMoney, formatMoneyParts, formatShare, parseAmount } from "./format";
import { formatDayHeading, formatMonthLabel, formatMonthRange } from "./date";

describe("parseAmount", () => {
  it.each([
    ["1,234.56", 1234.56],
    ["1234.5", 1234.5],
    ["1250", 1250],
    ["1,250", 1250],
    ["1,250,000", 1250000],
    ["12,5", 12.5],
    ["0.99", 0.99],
    [" $ 2,500 ", 2500],
  ])("%s → %d", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(["", "abc", "1,2,3", "-5", "12a", "1.2.3"])("invalid: %s", (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formats in en-US style", () => {
    expect(formatMoney(6500000, "TRY")).toBe("₺65,000.00");
    expect(formatMoney(6500000, "USD")).toBe("$65,000.00");
  });

  it("uses a true minus sign for negatives", () => {
    expect(formatMoney(-150, "TRY")).toBe("−₺1.50");
    expect(formatMoney(150, "TRY", { sign: "always" })).toBe("+₺1.50");
  });

  it("can split off the cents", () => {
    expect(formatMoneyParts(4125050, "TRY")).toEqual({ main: "₺41,250", fraction: ".50" });
  });
});

describe("percentages and counts", () => {
  it("shows small shares with one decimal", () => {
    expect(formatShare(0.534)).toBe("53%");
    expect(formatShare(0.045)).toBe("4.5%");
  });

  it("signs the change", () => {
    expect(formatChange(0.124)).toBe("+12.4%");
    expect(formatChange(-0.05)).toBe("−5%");
  });

  it("pluralizes", () => {
    expect(countLabel(1)).toBe("1 transaction");
    expect(countLabel(3)).toBe("3 transactions");
  });
});

describe("dates", () => {
  it("Today / Yesterday / full date", () => {
    expect(formatDayHeading("2026-09-26", "2026-09-26")).toBe("Today");
    expect(formatDayHeading("2026-09-25", "2026-09-26")).toBe("Yesterday");
    expect(formatDayHeading("2026-09-12", "2026-09-26")).toBe("Saturday, September 12");
    expect(formatDayHeading("2025-12-31", "2026-09-26")).toBe("Wednesday, December 31, 2025");
  });

  it("month labels", () => {
    expect(formatMonthLabel("2026-09")).toBe("September 2026");
    expect(formatMonthRange("2026-07", "2026-09")).toBe("Jul – Sep 2026");
    expect(formatMonthRange("2025-11", "2026-01")).toBe("Nov 2025 – Jan 2026");
  });
});
