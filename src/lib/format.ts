import type { Currency } from "./types";

const LOCALE = "en-US";
export const MINUS = "−";

/** Converts an amount to integer minor units (cents); all arithmetic happens in minor units. */
export const toKurus = (amount: number) => Math.round(amount * 100);
export const fromKurus = (kurus: number) => kurus / 100;

const moneyFormatters = new Map<string, Intl.NumberFormat>();
function moneyFormatter(currency: Currency, fractionDigits: 0 | 2) {
  const key = `${currency}-${fractionDigits}`;
  let f = moneyFormatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    moneyFormatters.set(key, f);
  }
  return f;
}

export type SignMode = "none" | "auto" | "always";

function signFor(kurus: number, mode: SignMode): string {
  if (mode === "none" || kurus === 0) return "";
  if (kurus < 0) return MINUS;
  return mode === "always" ? "+" : "";
}

/** 6500000 → "₺65,000.00". Negatives always use a true minus sign (−). */
export function formatMoney(
  kurus: number,
  currency: Currency,
  { sign = "auto", fractionDigits = 2 }: { sign?: SignMode; fractionDigits?: 0 | 2 } = {},
): string {
  return signFor(kurus, sign) + moneyFormatter(currency, fractionDigits).format(Math.abs(kurus) / 100);
}

/** Income with "+", expense with "−". */
export function formatSignedByType(kurus: number, type: "income" | "expense", currency: Currency) {
  return (type === "income" ? "+" : MINUS) + formatMoney(Math.abs(kurus), currency, { sign: "none" });
}

/** For large amounts: splits off the cents so they can be rendered smaller. */
export function formatMoneyParts(
  kurus: number,
  currency: Currency,
  sign: SignMode = "auto",
): { main: string; fraction: string } {
  const parts = moneyFormatter(currency, 2).formatToParts(Math.abs(kurus) / 100);
  let main = signFor(kurus, sign);
  let fraction = "";
  for (const p of parts) {
    if (p.type === "decimal" || p.type === "fraction") fraction += p.value;
    else main += p.value;
  }
  return { main: main.trim(), fraction };
}

const compactFormatter = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
/** Axis labels: 6500000 cents → "65K" */
export const formatCompact = (kurus: number) => compactFormatter.format(kurus / 100);

const currencySymbols: Record<Currency, string> = { TRY: "₺", USD: "$", EUR: "€" };
export const currencySymbol = (currency: Currency) => currencySymbols[currency];

/** 0.534 → "53%", 0.045 → "4.5%" */
export function formatShare(share: number): string {
  const digits = share > 0 && share < 0.1 ? 1 : 0;
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(share);
}

/** 0.124 → "+12.4%", −0.05 → "−5%" */
export function formatChange(change: number): string {
  const abs = new Intl.NumberFormat(LOCALE, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Math.abs(change));
  if (Math.abs(change) < 0.0005) return abs;
  return (change > 0 ? "+" : MINUS) + abs;
}

/**
 * Parses user input. en-US format (dot decimal, comma thousands) is primary:
 * "1,234.56" → 1234.56, "1234.5" → 1234.5, "1,250" → 1250.
 * A single comma followed by 1–2 digits is also accepted as a decimal ("12,5" → 12.5).
 * Returns `null` when invalid.
 */
export function parseAmount(input: string): number | null {
  let s = input.replace(/[\s₺$€]|TL|TRY|USD|EUR/gi, "");
  if (s === "") return null;
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    s = s.replace(/,/g, "");
  } else if (/^\d+,\d{1,2}$/.test(s)) {
    s = s.replace(",", ".");
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const value = Number(s);
  return Number.isFinite(value) ? value : null;
}

/** 1234.5 → "1,234.50" (form field display) */
export function formatAmountInput(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** 1 → "1 transaction", 3 → "3 transactions" */
export const countLabel = (n: number, noun = "transaction") => `${n} ${noun}${n === 1 ? "" : "s"}`;
