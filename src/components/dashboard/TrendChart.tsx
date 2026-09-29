import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { monthlyTrend, periodRange } from "@/lib/calc";
import { currentMonthKey, formatMonthLabel, formatShortMonth } from "@/lib/date";
import { formatCompact, formatSignedByType } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useFinanceStore, useSettingsStore, useUiStore } from "@/store/useFinanceStore";

export function TrendChart() {
  const transactions = useFinanceStore((s) => s.transactions);
  const period = useUiStore((s) => s.period);
  const currency = useSettingsStore((s) => s.currency);
  const reduced = usePrefersReducedMotion();

  const endMonth = period.mode === "all" ? currentMonthKey() : period.month;
  const range = periodRange(period);
  const data = useMemo(
    () =>
      monthlyTrend(transactions, endMonth, 6).map((p) => ({
        ...p,
        label: formatShortMonth(p.month),
        // Months inside the selected period at full strength, others dimmed
        inPeriod: !range || (p.month >= range.start.slice(0, 7) && p.month <= range.end.slice(0, 7)),
      })),
    [transactions, endMonth, range],
  );

  return (
    <section id="trend" aria-labelledby="trend-title" className="panel scroll-mt-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="trend-title" className="text-xl font-semibold">
          Last 6 months
        </h2>
        <div aria-hidden className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-income" /> Income
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-expense" /> Expenses
          </span>
        </div>
      </div>

      <div aria-hidden className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} accessibilityLayer={false} barGap={3} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              dy={4}
            />
            <YAxis
              width={40}
              allowDecimals={false}
              domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax : 100000)]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              tickFormatter={(v: number) => formatCompact(v)}
            />
            <Tooltip
              cursor={{ fill: "var(--soft)", radius: 8 }}
              content={(props: TooltipContentProps) => <TrendTooltip {...props} currency={currency} />}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill="var(--income)"
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
              isAnimationActive={!reduced}
              shape={(p: BarShape) => <FadedBar {...p} />}
            />
            <Bar
              dataKey="expense"
              name="Expenses"
              fill="var(--expense)"
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
              isAnimationActive={!reduced}
              shape={(p: BarShape) => <FadedBar {...p} />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table equivalent for screen readers */}
      <table className="sr-only">
        <caption>Income and expenses for the last 6 months</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Income</th>
            <th scope="col">Expenses</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.month}>
              <th scope="row">{formatMonthLabel(p.month)}</th>
              <td>{formatSignedByType(p.income, "income", currency)}</td>
              <td>{formatSignedByType(p.expense, "expense", currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

interface BarShape {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: { inPeriod: boolean };
}

function FadedBar({ x = 0, y = 0, width = 0, height = 0, fill, payload }: BarShape) {
  if (height <= 0) return null;
  const r = Math.min(4, width / 2, height);
  // Rectangle with rounded top corners
  const d = `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
  return <path d={d} fill={fill} opacity={payload?.inPeriod === false ? 0.35 : 1} />;
}

function TrendTooltip({ active, payload, currency }: TooltipContentProps & { currency: "TRY" | "USD" | "EUR" }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as { month: string; income: number; expense: number };
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-[0_8px_24px_rgba(18,26,25,0.12)]">
      <p className="mb-1 font-semibold text-ink">{formatMonthLabel(point.month)}</p>
      <p className="flex justify-between gap-4 tabular">
        <span className="text-muted-foreground">Income</span>
        <span className="font-semibold text-income">{formatSignedByType(point.income, "income", currency)}</span>
      </p>
      <p className="flex justify-between gap-4 tabular">
        <span className="text-muted-foreground">Expenses</span>
        <span className="font-semibold text-expense">{formatSignedByType(point.expense, "expense", currency)}</span>
      </p>
    </div>
  );
}
