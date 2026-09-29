import { formatMoneyParts, type SignMode } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useFinanceStore";

interface MoneyProps {
  /** cents */
  value: number;
  sign?: SignMode;
  className?: string;
  /** Class for the cents part: smaller and dimmer in large amounts. */
  fractionClassName?: string;
}

/** Large amounts: "₺41,250" + a small ".50". Tabular digits. */
export function Money({ value, sign = "auto", className, fractionClassName }: MoneyProps) {
  const currency = useSettingsStore((s) => s.currency);
  const { main, fraction } = formatMoneyParts(value, currency, sign);
  return (
    <span className={cn("tabular whitespace-nowrap", className)}>
      {main}
      <span className={cn("text-[0.55em] font-semibold opacity-60", fractionClassName)}>{fraction}</span>
    </span>
  );
}
