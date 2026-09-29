import { useMemo } from "react";
import { MinusIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_BY_ID } from "@/data/categories";
import { groupByDate } from "@/lib/calc";
import { formatDayHeading } from "@/lib/date";
import { countLabel, formatMoney } from "@/lib/format";
import type { Transaction, TransactionType } from "@/lib/types";
import { useFinanceStore, useSettingsStore, useUiStore } from "@/store/useFinanceStore";
import { usePeriodData } from "@/store/usePeriodData";
import { TransactionRow } from "./TransactionRow";

const ALL = "all";

const TYPE_OPTIONS = [
  { value: "all" as const, label: "All" },
  { value: "expense" as const, label: "Expenses", icon: <MinusIcon /> },
  { value: "income" as const, label: "Income", icon: <PlusIcon /> },
];

export function useDeleteWithUndo() {
  const remove = useFinanceStore((s) => s.remove);
  const restore = useFinanceStore((s) => s.restore);
  return async (t: Transaction) => {
    const removed = await remove(t.id);
    if (!removed) return;
    toast("Transaction deleted", {
      description: `${CATEGORY_BY_ID[removed.categoryId]?.name ?? "Transaction"}${removed.note ? ` · ${removed.note}` : ""}`,
      action: {
        label: "Undo",
        onClick: () => {
          void restore(removed).then(() => toast.success("Transaction restored"));
        },
      },
    });
  };
}

export function TransactionList() {
  const { transactions, label } = usePeriodData();
  const filters = useUiStore((s) => s.filters);
  const setFilters = useUiStore((s) => s.setFilters);
  const resetFilters = useUiStore((s) => s.resetFilters);
  const openEdit = useUiStore((s) => s.openEdit);
  const openCreate = useUiStore((s) => s.openCreate);
  const currency = useSettingsStore((s) => s.currency);
  const deleteWithUndo = useDeleteWithUndo();

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLocaleLowerCase();
    return transactions.filter((t) => {
      if (filters.type !== "all" && t.type !== filters.type) return false;
      if (filters.categoryId && t.categoryId !== filters.categoryId) return false;
      if (q) {
        const haystack = `${t.note ?? ""} ${CATEGORY_BY_ID[t.categoryId]?.name ?? ""}`.toLocaleLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);
  const hasFilters = filters.search !== "" || filters.type !== "all" || filters.categoryId !== null;
  const categoryOptions = CATEGORIES.filter((c) => filters.type === "all" || c.type === filters.type);
  const selectedCategory = filters.categoryId ? CATEGORY_BY_ID[filters.categoryId] : undefined;

  const setType = (type: TransactionType | "all") => {
    const keepCategory =
      filters.categoryId && (type === "all" || CATEGORY_BY_ID[filters.categoryId]?.type === type);
    setFilters({ type, categoryId: keepCategory ? filters.categoryId : null });
  };

  return (
    <section id="transactions" aria-labelledby="tx-title" className="panel scroll-mt-6 p-4 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="tx-title" className="text-xl font-semibold">
          Transactions
        </h2>
        <span className="text-sm text-muted-foreground tabular">
          {countLabel(filtered.length)} · {label}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Search notes"
            aria-label="Search notes"
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SegmentedControl
            className="w-full sm:w-auto"
            label="Transaction type"
            size="sm"
            options={TYPE_OPTIONS}
            value={filters.type}
            onValueChange={setType}
          />
          <Select value={filters.categoryId ?? ALL} onValueChange={(v) => setFilters({ categoryId: v === ALL ? null : v })}>
            <SelectTrigger aria-label="Category filter" className="h-10 w-full min-w-0 rounded-xl sm:w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-xl">
              <SelectItem value={ALL}>All categories</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="size-2 rounded-full" style={{ background: c.color }} />
                  {c.name}
                  {filters.type === "all" && (
                    <span className="text-xs text-muted-foreground">{c.type === "income" ? "income" : "expense"}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {selectedCategory && (
            <button
              type="button"
              onClick={() => setFilters({ categoryId: null })}
              className="inline-flex h-8 items-center gap-2 rounded-full bg-soft-strong pr-2 pl-3 text-xs font-medium text-ink hover:bg-line"
              aria-label={`Remove ${selectedCategory.name} filter`}
            >
              <span className="size-2 rounded-full" style={{ background: selectedCategory.color }} />
              {selectedCategory.name}
              <XIcon className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={resetFilters}
            className="h-8 rounded-full px-2 text-xs font-medium text-brand underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line px-4 py-10 text-center">
          <p className="font-medium text-ink">
            {hasFilters ? "No transactions match these filters." : "No transactions in this period."}
          </p>
          {hasFilters ? (
            <button type="button" onClick={resetFilters} className="mt-2 text-sm font-medium text-brand hover:underline">
              Clear filters
            </button>
          ) : (
            <button type="button" onClick={() => openCreate()} className="mt-2 text-sm font-medium text-brand hover:underline">
              Add transaction
            </button>
          )}
        </div>
      ) : (
        <div className="mt-2">
          {groups.map((group) => (
            <div key={group.date}>
              <h3 className="flex items-center justify-between px-2 pt-4 pb-1 font-sans text-xs font-medium text-muted-foreground sm:px-3">
                <span>{formatDayHeading(group.date)}</span>
                <span className="tabular">{formatMoney(group.net, currency, { sign: "always" })}</span>
              </h3>
              <ul className="flex flex-col">
                {group.transactions.map((t) => (
                  <TransactionRow key={t.id} transaction={t} onEdit={openEdit} onDelete={deleteWithUndo} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
