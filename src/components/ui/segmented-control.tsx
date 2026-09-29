/**
 * Segmented Control — adapted from the 21st.dev component (ddoemonn/segmented-control).
 * Sliding thumb + mask technique, arrow/Home/End keyboard navigation, radio group semantics.
 * Colors bound to project tokens; icon, size and "tone" support added.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 520, damping: 34, mass: 0.45 } as const;

export type SegmentedOption<T extends string = string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** Text color while selected (e.g. "text-expense") */
  tone?: string;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  label,
  value,
  onValueChange,
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  const count = Math.max(1, options.length);
  const template = `repeat(${count}, minmax(0, 1fr))`;
  const found = options.findIndex((o) => o.value === value);
  const index = found < 0 ? 0 : found;
  const [hovered, setHovered] = useState(-1);

  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useReducedMotion();
  const pos = useMotionValue(index);
  const thumbX = useTransform(pos, (v) => `${v * 100}%`);
  const maskX = useTransform(pos, (v) => `${v * -100}%`);

  useEffect(() => {
    if (reduced) {
      pos.set(index);
      return;
    }
    const controls = animate(pos, index, SPRING);
    return () => controls.stop();
  }, [index, reduced, pos]);

  const seek = useCallback(
    (from: number, dir: number) => {
      let i = from;
      for (let k = 0; k < count; k++) {
        i = (i + dir + count) % count;
        if (!options[i]?.disabled) return i;
      }
      return from;
    },
    [count, options],
  );

  const go = (i: number) => {
    const option = options[i];
    if (!option || option.disabled) return;
    buttons.current[i]?.focus();
    if (option.value !== value) onValueChange(option.value);
  };

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const keys: Record<string, () => number> = {
      ArrowRight: () => seek(i, 1),
      ArrowDown: () => seek(i, 1),
      ArrowLeft: () => seek(i, -1),
      ArrowUp: () => seek(i, -1),
      Home: () => seek(count - 1, 1),
      End: () => seek(0, -1),
    };
    const next = keys[e.key];
    if (!next) return;
    e.preventDefault();
    go(next());
  };

  const seg = cn(
    "flex items-center justify-center gap-2 whitespace-nowrap text-center font-medium [&_svg]:size-4 [&_svg]:shrink-0",
    size === "sm" && "h-8 px-3 text-xs",
    size === "md" && "h-9 px-4 text-sm",
    size === "lg" && "h-11 px-4 text-base",
  );

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "relative inline-block rounded-xl border border-line bg-soft p-[3px] select-none",
        className,
      )}
    >
      <div className="relative grid" style={{ gridTemplateColumns: template, touchAction: "manipulation" }}>
        {options.map((option, i) => (
          <span
            key={option.value}
            aria-hidden
            className={cn(
              seg,
              "pointer-events-none transition-colors",
              option.disabled
                ? "text-muted-foreground/50"
                : hovered === i && i !== index
                  ? "text-ink"
                  : "text-muted-foreground",
            )}
          >
            {option.icon}
            {option.label}
          </span>
        ))}

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden rounded-[9px] border border-line bg-surface shadow-[0_1px_2px_rgba(30,42,40,0.08)] dark:bg-soft-strong dark:shadow-none"
          style={{ width: `${100 / count}%`, x: thumbX }}
          initial={false}
        >
          <motion.div className="absolute inset-0" style={{ x: maskX }} initial={false}>
            <div
              className="absolute inset-y-0 left-0 grid"
              style={{ width: `${count * 100}%`, gridTemplateColumns: template }}
            >
              {options.map((option) => (
                <span key={option.value} className={cn(seg, "-mt-px", option.tone ?? "text-ink")}>
                  {option.icon}
                  {option.label}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: template }}
          onPointerLeave={() => setHovered(-1)}
        >
          {options.map((option, i) => (
            <button
              key={option.value}
              ref={(node) => {
                buttons.current[i] = node;
              }}
              type="button"
              role="radio"
              aria-checked={i === index}
              aria-disabled={option.disabled || undefined}
              tabIndex={i === index ? 0 : -1}
              onClick={() => !option.disabled && option.value !== value && onValueChange(option.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              onPointerEnter={() => !option.disabled && setHovered(i)}
              className="cursor-pointer rounded-[9px] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)] aria-disabled:cursor-not-allowed"
            >
              <span className="sr-only">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SegmentedControl;
