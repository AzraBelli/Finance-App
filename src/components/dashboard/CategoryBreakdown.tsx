import { useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { TransactionType } from "@/lib/types";
import { usePeriodData } from "@/store/usePeriodData";
import { useUiStore } from "@/store/useFinanceStore";
import { CategoryDonut, EmptyDonut } from "./CategoryDonut";
import { CategoryLegend } from "./CategoryLegend";

const TYPE_OPTIONS = [
  { value: "expense" as const, label: "Expenses", icon: <MinusIcon />, tone: "text-expense" },
  { value: "income" as const, label: "Income", icon: <PlusIcon />, tone: "text-income" },
];

export function CategoryBreakdown() {
  const { slices, totals, label } = usePeriodData();
  const type = useUiStore((s) => s.donutType);
  const setType = useUiStore((s) => s.setDonutType);
  const filters = useUiStore((s) => s.filters);
  const toggleCategoryFilter = useUiStore((s) => s.toggleCategoryFilter);
  const openCreate = useUiStore((s) => s.openCreate);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const current = slices[type];
  const total = type === "expense" ? totals.expense : totals.income;
  const typeLabel = type === "expense" ? "Expense" : "Income";

  const changeType = (next: TransactionType) => {
    setActiveIndex(null);
    setType(next);
  };

  return (
    <section id="overview" aria-labelledby="breakdown-title" className="panel scroll-mt-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="breakdown-title" className="text-xl font-semibold">
          {type === "expense" ? "Spending by category" : "Income by category"}
        </h2>
        <SegmentedControl label="Chart type" options={TYPE_OPTIONS} value={type} onValueChange={changeType} />
      </div>

      {current.length === 0 ? (
        <div className="grid items-center gap-6 py-6 md:grid-cols-2">
          <div className="w-full max-w-[260px] justify-self-center">
            <EmptyDonut />
          </div>
          <div className="text-center md:text-left">
            <p className="font-display text-xl font-semibold">
              {type === "expense" ? "No expenses in this period." : "No income in this period."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {type === "expense" ? "Add your first expense." : "Add your first income."}
            </p>
            <Button className="mt-4 rounded-full" onClick={() => openCreate(type)}>
              <PlusIcon /> Add transaction
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <CategoryDonut
            slices={current}
            total={total}
            type={type}
            periodLabel={label}
            activeIndex={activeIndex}
            onActiveChange={setActiveIndex}
          />
          <CategoryLegend
            slices={current}
            typeLabel={typeLabel}
            activeIndex={activeIndex}
            selectedCategoryId={filters.categoryId}
            onActiveChange={setActiveIndex}
            onSelect={(id) => toggleCategoryFilter(id, type)}
          />
        </div>
      )}
    </section>
  );
}
