import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import { Money } from "@/components/Money";
import { countLabel, formatChange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { comparisonLabel, usePeriodData } from "@/store/usePeriodData";

type Kind = "income" | "expense" | "net";

export function SummaryStrip() {
  const { totals, change, counts, period } = usePeriodData();
  const compare = comparisonLabel(period);
  const netNegative = totals.net < 0;

  return (
    <section aria-label="Period summary" className="panel grid grid-cols-2 overflow-hidden md:grid-cols-[1fr_1fr_1.25fr]">
      <Stat
        kind="income"
        label="Total income"
        className="border-r border-line max-md:border-b"
        value={<Money value={totals.income} sign="always" className="font-display text-xl font-semibold sm:text-title" />}
        change={change?.income}
        compare={compare}
        fallback={countLabel(counts.income)}
      />
      <Stat
        kind="expense"
        label="Total expenses"
        className="max-md:border-b md:border-r md:border-line"
        value={<Money value={-totals.expense} sign="auto" className="font-display text-xl font-semibold sm:text-title" />}
        change={change?.expense}
        compare={compare}
        fallback={countLabel(counts.expense)}
      />
      <Stat
        kind="net"
        label="Net balance"
        className="col-span-2 md:col-span-1 md:bg-soft/60"
        value={
          <Money
            value={totals.net}
            sign="always"
            className={cn(
              "font-display text-[32px] leading-10 font-bold tracking-tight sm:text-display",
              netNegative ? "text-expense" : "text-ink",
            )}
          />
        }
        change={change?.net}
        compare={compare}
        fallback={netNegative ? "Spending exceeds income" : "All time"}
      />
    </section>
  );
}

interface StatProps {
  kind: Kind;
  label: string;
  value: React.ReactNode;
  change: number | null | undefined;
  compare: string | null;
  fallback: string;
  className?: string;
}

function Stat({ kind, label, value, change, compare, fallback, className }: StatProps) {
  // An increase is good for income and net, bad for expenses.
  const good = change == null ? null : kind === "expense" ? change <= 0 : change >= 0;
  const Arrow = change != null && change < 0 ? ArrowDownRightIcon : ArrowUpRightIcon;

  return (
    <div className={cn("flex min-w-0 flex-col justify-between gap-2 p-4 sm:p-6", className)}>
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {kind !== "net" && (
          <span aria-hidden className={cn("size-2 rounded-full", kind === "income" ? "bg-income" : "bg-expense")} />
        )}
        {label}
      </span>
      <div className="min-w-0 truncate">{value}</div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {change != null && compare ? (
          <>
            <span className={cn("inline-flex items-center gap-1 font-semibold tabular", good ? "text-income" : "text-expense")}>
              <Arrow aria-hidden className="size-4" />
              {formatChange(change)}
            </span>
            <span className="truncate">{compare}</span>
          </>
        ) : compare ? (
          <span>No records in the previous period</span>
        ) : (
          <span>{fallback}</span>
        )}
      </span>
    </div>
  );
}
