import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { currentMonthKey, shiftMonth } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Period } from "@/lib/types";
import { periodLabel } from "@/store/usePeriodData";
import { useUiStore } from "@/store/useFinanceStore";

export function PeriodHeader() {
  const period = useUiStore((s) => s.period);
  const setPeriod = useUiStore((s) => s.setPeriod);
  const openCreate = useUiStore((s) => s.openCreate);
  const now = currentMonthKey();

  const step = period.mode === "last3" ? 3 : 1;
  const unit = period.mode === "last3" ? "3 months" : "month";
  const canNavigate = period.mode !== "all";
  const atLatest = period.month >= now;

  const quick: { label: string; active: boolean; next: Period }[] = [
    { label: "This month", active: period.mode === "month" && period.month === now, next: { mode: "month", month: now } },
    { label: "Last 3 months", active: period.mode === "last3", next: { mode: "last3", month: now } },
    { label: "All time", active: period.mode === "all", next: { mode: "all", month: now } },
  ];

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-center gap-2">
        <h1 aria-live="polite" className="min-w-0 truncate font-display text-title font-bold tracking-tight">
          <span className="sr-only">Finance dashboard, </span>
          {periodLabel(period)}
        </h1>
        {canNavigate && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={`Previous ${unit}`}
              onClick={() => setPeriod({ ...period, month: shiftMonth(period.month, -step) })}
            >
              <ChevronLeftIcon className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={`Next ${unit}`}
              disabled={atLatest}
              onClick={() => setPeriod({ ...period, month: shiftMonth(period.month, step) })}
            >
              <ChevronRightIcon className="size-5" />
            </Button>
          </div>
        )}
      </div>

      <div
        role="group"
        aria-label="Quick period"
        className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 sm:mx-0 sm:w-auto sm:px-0 md:ml-auto"
      >
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            aria-pressed={q.active}
            onClick={() => setPeriod(q.next)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
              q.active ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink hover:border-line-strong",
            )}
          >
            {q.label}
          </button>
        ))}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="hidden h-9 rounded-full pr-2 pl-4 font-semibold md:inline-flex" onClick={() => openCreate()}>
            <PlusIcon /> Add transaction
            <kbd className="ml-1 grid size-6 place-items-center rounded-full bg-on-brand/20 font-sans text-xs">N</kbd>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Shortcut: N</TooltipContent>
      </Tooltip>
    </header>
  );
}
