import { useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import type { CategoryTotal, DonutSlice } from "@/lib/calc";
import { formatMoney, formatShare } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useFinanceStore";

interface CategoryLegendProps {
  slices: DonutSlice[];
  typeLabel: string;
  activeIndex: number | null;
  selectedCategoryId: string | null;
  onActiveChange: (index: number | null) => void;
  onSelect: (categoryId: string) => void;
}

/**
 * The accessible counterpart of the chart: each row gives name, amount and share as text.
 * Clicking a row filters the transaction list by that category.
 */
export function CategoryLegend({
  slices,
  typeLabel,
  activeIndex,
  selectedCategoryId,
  onActiveChange,
  onSelect,
}: CategoryLegendProps) {
  const [otherOpen, setOtherOpen] = useState(false);

  return (
    <div>
      <ul aria-label={`${typeLabel} categories`} className="flex flex-col gap-1">
        {slices.map((slice, index) => {
          const hoverProps = {
            onMouseEnter: () => onActiveChange(index),
            onMouseLeave: () => onActiveChange(null),
            onFocus: () => onActiveChange(index),
            onBlur: () => onActiveChange(null),
          };
          if (slice.isOther) {
            const childSelected = slice.children?.some((c) => c.categoryId === selectedCategoryId);
            const open = otherOpen || !!childSelected;
            return (
              <li key={slice.categoryId}>
                <LegendRow
                  item={slice}
                  highlighted={activeIndex === index}
                  aria-expanded={open}
                  onClick={() => setOtherOpen(!open)}
                  trailing={
                    <ChevronDownIcon
                      className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
                    />
                  }
                  {...hoverProps}
                />
                {open && (
                  <ul aria-label="Other items breakdown" className="mt-1 ml-6 flex flex-col gap-1 border-l border-line pl-2">
                    {slice.children?.map((child) => (
                      <li key={child.categoryId}>
                        <LegendRow
                          item={child}
                          compact
                          selected={child.categoryId === selectedCategoryId}
                          aria-pressed={child.categoryId === selectedCategoryId}
                          onClick={() => onSelect(child.categoryId)}
                          {...hoverProps}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          }
          return (
            <li key={slice.categoryId}>
              <LegendRow
                item={slice}
                highlighted={activeIndex === index}
                selected={slice.categoryId === selectedCategoryId}
                aria-pressed={slice.categoryId === selectedCategoryId}
                onClick={() => onSelect(slice.categoryId)}
                {...hoverProps}
              />
            </li>
          );
        })}
      </ul>
      <p className="mt-3 px-3 text-xs text-muted-foreground">Click a category to filter the transaction list.</p>
    </div>
  );
}

interface LegendRowProps extends React.ComponentProps<"button"> {
  item: CategoryTotal;
  highlighted?: boolean;
  selected?: boolean;
  compact?: boolean;
  trailing?: React.ReactNode;
}

function LegendRow({ item, highlighted, selected, compact, trailing, className, ...props }: LegendRowProps) {
  const currency = useSettingsStore((s) => s.currency);
  return (
    <button
      type="button"
      className={cn(
        "group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-3 text-left transition-colors",
        compact ? "py-2" : "py-2 md:py-3",
        highlighted && "bg-soft",
        selected ? "bg-soft-strong" : "hover:bg-soft",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn("rounded-full", compact ? "size-2" : "size-3")}
        style={{ background: item.color }}
      />
      <span className="flex min-w-0 items-center gap-2">
        <span className={cn("truncate font-medium text-ink", compact ? "text-xs" : "text-sm")}>{item.name}</span>
        {selected && (
          <span className="flex items-center gap-1 rounded-full bg-brand px-2 text-xs font-semibold text-on-brand">
            <CheckIcon className="size-3" strokeWidth={3} /> Filter
          </span>
        )}
      </span>
      <span className="flex items-center gap-3 tabular">
        <span className={cn("text-ink", compact ? "text-xs" : "text-sm font-semibold")}>
          {formatMoney(item.total, currency)}
        </span>
        <span className={cn("w-12 text-right text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          {formatShare(item.share)}
        </span>
        {trailing}
      </span>
      {!compact && (
        <span aria-hidden className="col-span-2 col-start-2 mt-2 h-1 overflow-hidden rounded-full bg-soft-strong">
          <span
            className="block h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(item.share * 100, 1.5)}%`, background: item.color }}
          />
        </span>
      )}
    </button>
  );
}
