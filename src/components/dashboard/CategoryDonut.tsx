/**
 * Donut chart — adapted from the 21st.dev "Pie Chart" (arihantcodes, Recharts) patterns:
 * padded, rounded sectors, dimming the other slices on hover, motion settings.
 * Added: the active slice pops out, a changing center summary, a clockwise fill on first load.
 */
import { Pie, PieChart, ResponsiveContainer, Sector, type PieSectorShapeProps } from "recharts";
import type { DonutSlice } from "@/lib/calc";
import { countLabel, formatShare } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/hooks";
import type { TransactionType } from "@/lib/types";
import { Money } from "@/components/Money";

const HOVER_TRANSITION = "opacity 200ms ease, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)";
const POP_OUT = 7;
const RAD = Math.PI / 180;

/** markOpacity from the 21st chart-kit: all full when nothing is active, others dimmed otherwise. */
const markOpacity = (active: number | null, index: number) =>
  active === null || active === index ? 1 : 0.32;

interface CategoryDonutProps {
  slices: DonutSlice[];
  total: number;
  type: TransactionType;
  periodLabel: string;
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
}

export function CategoryDonut({
  slices,
  total,
  type,
  periodLabel,
  activeIndex,
  onActiveChange,
}: CategoryDonutProps) {
  const reduced = usePrefersReducedMotion();
  const data = slices.map((s) => ({ ...s, fill: s.color }));
  const active = activeIndex !== null ? slices[activeIndex] : undefined;
  const typeWord = type === "expense" ? "expense" : "income";

  const renderSlice = (props: PieSectorShapeProps) => {
    const { index, cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, cornerRadius } = props;
    const isActive = index === activeIndex;
    const mid = (startAngle + endAngle) / 2;
    const dx = isActive ? Math.cos(-mid * RAD) * POP_OUT : 0;
    const dy = isActive ? Math.sin(-mid * RAD) * POP_OUT : 0;
    return (
      <g
        onMouseEnter={() => onActiveChange(index)}
        onMouseLeave={() => onActiveChange(null)}
        onClick={() => onActiveChange(isActive ? null : index)}
        style={{
          transform: `translate(${dx}px, ${dy}px)`,
          opacity: markOpacity(activeIndex, index),
          transition: HOVER_TRANSITION,
          cursor: "pointer",
        }}
      >
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={isActive ? outerRadius + 3 : outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          cornerRadius={cornerRadius}
          fill={fill}
        />
      </g>
    );
  };

  const summary = slices.map((s) => `${s.name} ${formatShare(s.share)}`).join(", ");

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      <div role="img" aria-label={`${periodLabel} ${typeWord} breakdown: ${summary}`} className="size-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer={false} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius="71%"
              outerRadius="92%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={slices.length > 1 ? 1.6 : 0}
              cornerRadius={5}
              stroke="none"
              rootTabIndex={-1}
              isAnimationActive={!reduced}
              animationBegin={80}
              animationDuration={700}
              animationEasing="ease-out"
              shape={renderSlice}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Center summary: the total by default, the category when a slice is active */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[18%] flex flex-col items-center justify-center text-center"
      >
        {active ? (
          <>
            <span className="flex max-w-full items-center gap-2 text-sm font-medium text-ink">
              <span className="size-2 shrink-0 rounded-full" style={{ background: active.color }} />
              <span className="truncate">{active.name}</span>
            </span>
            <Money value={active.total} className="mt-1 font-display text-title font-semibold text-ink" />
            <span className="mt-1 text-sm text-muted-foreground tabular">
              {formatShare(active.share)} · {countLabel(active.count)}
            </span>
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground">{type === "expense" ? "Total expenses" : "Total income"}</span>
            <Money value={total} className="mt-1 font-display text-title font-semibold text-ink" />
            <span className="mt-1 text-sm text-muted-foreground">{periodLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}

/** No data: a gray ring. */
export function EmptyDonut() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]" aria-hidden>
      <svg viewBox="0 0 100 100" className="size-full">
        <circle cx="50" cy="50" r="40.5" fill="none" stroke="var(--empty-ring)" strokeWidth="10.5" />
      </svg>
    </div>
  );
}
