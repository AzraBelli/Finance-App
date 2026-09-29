import { create } from "zustand";
import { persist } from "zustand/middleware";
import { currentMonthKey } from "@/lib/date";
import type {
  Currency,
  Period,
  ThemePreference,
  Transaction,
  TransactionInput,
  TransactionType,
} from "@/lib/types";
import { LocalStorageTransactionRepository } from "@/repositories/LocalStorageTransactionRepository";
import type { TransactionRepository } from "@/repositories/TransactionRepository";

/* ---------- Transactions: the repository is the single source of truth ---------- */

interface FinanceState {
  transactions: Transaction[];
  status: "idle" | "loading" | "ready" | "error";
  load: () => Promise<void>;
  add: (input: TransactionInput) => Promise<Transaction>;
  update: (id: string, input: TransactionInput) => Promise<Transaction>;
  remove: (id: string) => Promise<Transaction | undefined>;
  /** Undo a delete */
  restore: (transaction: Transaction) => Promise<void>;
  clearAll: () => Promise<void>;
}

const toInput = ({ type, amount, categoryId, date, note }: Transaction): TransactionInput => ({
  type,
  amount,
  categoryId,
  date,
  note,
});

export function createFinanceStore(repository: TransactionRepository) {
  return create<FinanceState>()((set, get) => ({
    transactions: [],
    status: "idle",

    async load() {
      set({ status: "loading" });
      try {
        set({ transactions: await repository.list(), status: "ready" });
      } catch {
        set({ status: "error" });
      }
    },

    async add(input) {
      const created = await repository.create(input);
      set({ transactions: [created, ...get().transactions] });
      return created;
    },

    async update(id, input) {
      const updated = await repository.update(id, { ...input, note: input.note || undefined });
      set({ transactions: get().transactions.map((t) => (t.id === id ? updated : t)) });
      return updated;
    },

    async remove(id) {
      const target = get().transactions.find((t) => t.id === id);
      await repository.remove(id);
      set({ transactions: get().transactions.filter((t) => t.id !== id) });
      return target;
    },

    async restore(transaction) {
      const created = await repository.create(toInput(transaction));
      set({ transactions: [created, ...get().transactions] });
    },

    async clearAll() {
      await Promise.all(get().transactions.map((t) => repository.remove(t.id)));
      set({ transactions: [] });
    },
  }));
}

export const useFinanceStore = createFinanceStore(new LocalStorageTransactionRepository());

/* ---------- Settings: persisted to localStorage ---------- */

interface SettingsState {
  currency: Currency;
  theme: ThemePreference;
  setCurrency: (currency: Currency) => void;
  setTheme: (theme: ThemePreference) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: "USD",
      theme: "system",
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
    }),
    // The theme script in index.html reads this key too.
    {
      name: "finance-settings",
      partialize: ({ currency, theme }) => ({ currency, theme }),
      // v1: default currency became USD; switch browsers that saved TRY under v0 once.
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Partial<Pick<SettingsState, "currency" | "theme">>;
        return {
          theme: state.theme ?? "system",
          currency: version < 1 ? "USD" : (state.currency ?? "USD"),
        };
      },
    },
  ),
);

/* ---------- UI state (not persisted) ---------- */

export interface TransactionFilters {
  search: string;
  type: TransactionType | "all";
  categoryId: string | null;
}

interface FormState {
  open: boolean;
  editing: Transaction | null;
  presetType: TransactionType;
}

interface UiState {
  period: Period;
  donutType: TransactionType;
  filters: TransactionFilters;
  form: FormState;
  settingsOpen: boolean;
  setPeriod: (period: Period) => void;
  setDonutType: (type: TransactionType) => void;
  setFilters: (patch: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
  /** From the legend: clicking the same category again clears the filter. */
  toggleCategoryFilter: (categoryId: string, type: TransactionType) => void;
  openCreate: (type?: TransactionType) => void;
  openEdit: (transaction: Transaction) => void;
  closeForm: () => void;
  setSettingsOpen: (open: boolean) => void;
}

const emptyFilters: TransactionFilters = { search: "", type: "all", categoryId: null };

export const useUiStore = create<UiState>()((set, get) => ({
  period: { mode: "month", month: currentMonthKey() },
  donutType: "expense",
  filters: emptyFilters,
  form: { open: false, editing: null, presetType: "expense" },
  settingsOpen: false,
  setPeriod: (period) => set({ period }),
  setDonutType: (donutType) => set({ donutType }),
  setFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),
  resetFilters: () => set({ filters: emptyFilters }),
  toggleCategoryFilter: (categoryId, type) => {
    const { filters } = get();
    set({
      filters:
        filters.categoryId === categoryId
          ? { ...filters, categoryId: null }
          : { ...filters, categoryId, type },
    });
  },
  openCreate: (type) =>
    set({ form: { open: true, editing: null, presetType: type ?? get().donutType } }),
  openEdit: (transaction) =>
    set({ form: { open: true, editing: transaction, presetType: transaction.type } }),
  closeForm: () => set({ form: { ...get().form, open: false } }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
}));
