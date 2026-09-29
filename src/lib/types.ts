export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  /** Always positive, 2-decimal precision. Arithmetic converts to integer cents. */
  amount: number;
  categoryId: string;
  /** ISO date, "2026-09-14" */
  date: string;
  note?: string;
  createdAt: string;
}

export type TransactionInput = Omit<Transaction, "id" | "createdAt">;

export type Currency = "TRY" | "USD" | "EUR";
export type ThemePreference = "light" | "dark" | "system";

export type PeriodMode = "month" | "last3" | "all";

export interface Period {
  mode: PeriodMode;
  /** Month the period ends in, "2026-09" */
  month: string;
}
