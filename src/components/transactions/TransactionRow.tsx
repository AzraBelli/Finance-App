import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORY_BY_ID } from "@/data/categories";
import { formatDateLong } from "@/lib/date";
import { formatSignedByType, toKurus } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useFinanceStore";

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

export function TransactionRow({ transaction: t, onEdit, onDelete }: TransactionRowProps) {
  const currency = useSettingsStore((s) => s.currency);
  const category = CATEGORY_BY_ID[t.categoryId];
  const categoryName = category?.name ?? "Uncategorized";
  const amount = formatSignedByType(toKurus(t.amount), t.type, currency);
  const typeWord = t.type === "income" ? "Income" : "Expense";

  return (
    <li className="group relative flex items-center rounded-xl transition-colors hover:bg-soft focus-within:bg-soft">
      <button
        type="button"
        onClick={() => onEdit(t)}
        onKeyDown={(e) => {
          if (e.key === "Delete") {
            e.preventDefault();
            onDelete(t);
          }
        }}
        aria-label={`${typeWord}: ${categoryName}, ${amount}, ${formatDateLong(t.date)}${t.note ? `, ${t.note}` : ""}. Click to edit.`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-2 pr-12 pl-2 text-left outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)] sm:pl-3"
      >
        <CategoryIcon icon={category?.icon ?? "circle"} color={category?.color ?? "#5F6B73"} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{categoryName}</span>
          <span className="block truncate text-xs text-muted-foreground">{t.note || typeWord}</span>
        </span>
        <span className={cn("shrink-0 text-sm font-semibold tabular", t.type === "income" ? "text-income" : "text-ink")}>
          {amount}
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-2 rounded-full text-muted-foreground"
            aria-label="Transaction options"
          >
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40 rounded-xl">
          <DropdownMenuItem onSelect={() => onEdit(t)}>
            <PencilIcon /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(t)}>
            <Trash2Icon /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
