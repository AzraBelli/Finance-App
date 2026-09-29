import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDaysIcon, MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CATEGORY_BY_ID, categoriesOfType } from "@/data/categories";
import { formatDateLong, formatDayHeading, parseISODate, toISODate, todayISO } from "@/lib/date";
import { currencySymbol, formatAmountInput, parseAmount } from "@/lib/format";
import type { Transaction, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFinanceStore, useSettingsStore } from "@/store/useFinanceStore";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.string().superRefine((value, ctx) => {
    const trimmed = value.trim();
    if (trimmed === "") return ctx.addIssue({ code: "custom", message: "Enter an amount" });
    if (trimmed.startsWith("-") || trimmed.startsWith("−")) {
      return ctx.addIssue({ code: "custom", message: "Amount must be greater than zero" });
    }
    const n = parseAmount(trimmed);
    if (n === null) return ctx.addIssue({ code: "custom", message: "Enter a valid amount, e.g. 1,250.50" });
    if (n <= 0) return ctx.addIssue({ code: "custom", message: "Amount must be greater than zero" });
    if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) {
      return ctx.addIssue({ code: "custom", message: "Use at most 2 decimal places" });
    }
    if (n >= 1e10) ctx.addIssue({ code: "custom", message: "Amount is too large" });
  }),
  categoryId: z.string().min(1, "Choose a category"),
  date: z.string().refine((d) => d <= todayISO(), "Date can’t be in the future"),
  note: z.string().max(80, "Note can be at most 80 characters"),
});

type FormValues = z.infer<typeof schema>;

const TYPE_OPTIONS = [
  { value: "expense" as const, label: "Expense", icon: <MinusIcon />, tone: "text-expense" },
  { value: "income" as const, label: "Income", icon: <PlusIcon />, tone: "text-income" },
];

interface TransactionFormProps {
  editing: Transaction | null;
  presetType: TransactionType;
  onDone: () => void;
  onDelete: (t: Transaction) => void;
}

export function TransactionForm({ editing, presetType, onDone, onDelete }: TransactionFormProps) {
  const add = useFinanceStore((s) => s.add);
  const update = useFinanceStore((s) => s.update);
  const currency = useSettingsStore((s) => s.currency);
  const [dateOpen, setDateOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editing
      ? {
          type: editing.type,
          amount: formatAmountInput(editing.amount),
          categoryId: editing.categoryId,
          date: editing.date,
          note: editing.note ?? "",
        }
      : { type: presetType, amount: "", categoryId: "", date: todayISO(), note: "" },
  });

  const type = useWatch({ control, name: "type" });
  const categories = categoriesOfType(type);

  const onSubmit = async (values: FormValues) => {
    const amount = Math.round((parseAmount(values.amount) ?? 0) * 100) / 100;
    const input = {
      type: values.type,
      amount,
      categoryId: values.categoryId,
      date: values.date,
      note: values.note.trim() || undefined,
    };
    try {
      if (editing) {
        await update(editing.id, input);
        toast.success("Transaction updated");
      } else {
        await add(input);
        toast.success(values.type === "expense" ? "Expense added" : "Income added");
      }
      onDone();
    } catch {
      toast.error("Couldn’t save. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <SegmentedControl
            label="Transaction type"
            size="lg"
            className="w-full"
            options={TYPE_OPTIONS}
            value={field.value}
            onValueChange={(next) => {
              field.onChange(next);
              const current = CATEGORY_BY_ID[getValues("categoryId")];
              if (current && current.type !== next) setValue("categoryId", "");
            }}
          />
        )}
      />

      {/* Amount: large and focused */}
      <div>
        <Label htmlFor="amount" className="text-sm text-muted-foreground">
          Amount
        </Label>
        <div
          className={cn(
            "mt-2 flex items-baseline gap-2 rounded-xl border bg-surface px-4 py-2 transition-shadow focus-within:border-brand focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)]",
            errors.amount ? "border-expense" : "border-line-strong",
          )}
        >
          <span aria-hidden className="font-display text-title font-semibold text-muted-foreground">
            {currencySymbol(currency)}
          </span>
          <input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            placeholder="0.00"
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? "amount-error" : undefined}
            className={cn(
              "w-full min-w-0 bg-transparent font-display text-display font-semibold tracking-tight tabular outline-none placeholder:text-line-strong",
              type === "income" ? "text-income" : "text-ink",
            )}
            {...register("amount", {
              onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                const n = parseAmount(e.target.value);
                if (n !== null && n > 0) setValue("amount", formatAmountInput(Math.round(n * 100) / 100));
              },
            })}
          />
        </div>
        <FieldError id="amount-error" message={errors.amount?.message} />
      </div>

      {/* Category: icon grid */}
      <fieldset>
        <legend className="text-sm font-medium text-muted-foreground">Category</legend>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <div className="mt-2 grid grid-cols-4 gap-2" aria-describedby={errors.categoryId ? "category-error" : undefined}>
              {categories.map((c) => {
                const selected = field.value === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => field.onChange(c.id)}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-2 rounded-xl border px-1 py-3 transition-colors",
                      selected ? "border-brand bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]" : "border-line hover:bg-soft",
                    )}
                  >
                    <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                    <span
                      className={cn(
                        "w-full truncate text-center text-xs",
                        selected ? "font-semibold text-ink" : "text-muted-foreground",
                      )}
                    >
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
        <FieldError id="category-error" message={errors.categoryId?.message} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-sm text-muted-foreground" id="date-label">
            Date
          </Label>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    aria-labelledby="date-label date-value"
                    className={cn(
                      "mt-2 h-10 w-full justify-start rounded-xl border-line-strong bg-surface font-normal",
                      errors.date && "border-expense",
                    )}
                  >
                    <CalendarDaysIcon className="text-muted-foreground" />
                    <span id="date-value">
                      {["Today", "Yesterday"].includes(formatDayHeading(field.value))
                        ? `${formatDayHeading(field.value)}, ${formatDateLong(field.value)}`
                        : formatDateLong(field.value)}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto rounded-xl p-0">
                  <Calendar
                    mode="single"
                    weekStartsOn={1}
                    selected={parseISODate(field.value)}
                    defaultMonth={parseISODate(field.value)}
                    disabled={{ after: new Date() }}
                    onSelect={(d) => {
                      if (d) field.onChange(toISODate(d));
                      setDateOpen(false);
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          <FieldError message={errors.date?.message} />
        </div>

        <div>
          <Label htmlFor="note" className="text-sm text-muted-foreground">
            Note <span className="font-normal">(optional)</span>
          </Label>
          <Input
            id="note"
            maxLength={80}
            placeholder={type === "expense" ? "e.g. Weekly groceries" : "e.g. Logo project"}
            className="mt-2 h-10 rounded-xl"
            {...register("note")}
          />
          <FieldError message={errors.note?.message} />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
        {editing && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full text-expense hover:bg-[color-mix(in_srgb,var(--expense)_10%,transparent)] hover:text-expense sm:mr-auto"
            onClick={() => onDelete(editing)}
          >
            <Trash2Icon /> Delete
          </Button>
        )}
        <Button type="button" variant="outline" className="rounded-full sm:ml-auto" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" className="rounded-full px-6 font-semibold" disabled={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-xs font-medium text-expense">
      {message}
    </p>
  );
}
