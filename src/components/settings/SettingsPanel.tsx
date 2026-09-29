import { DownloadIcon, MonitorIcon, MoonIcon, SunIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CATEGORIES } from "@/data/categories";
import { todayISO } from "@/lib/date";
import { countLabel } from "@/lib/format";
import { useIsDesktop } from "@/lib/hooks";
import type { Currency, ThemePreference } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFinanceStore, useSettingsStore, useUiStore } from "@/store/useFinanceStore";

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "TRY", label: "₺ TRY" },
];

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
  { value: "system", label: "System", icon: <MonitorIcon /> },
];

export function SettingsPanel() {
  const open = useUiStore((s) => s.settingsOpen);
  const setOpen = useUiStore((s) => s.setSettingsOpen);
  const { currency, theme, setCurrency, setTheme } = useSettingsStore();
  const transactions = useFinanceStore((s) => s.transactions);
  const clearAll = useFinanceStore((s) => s.clearAll);
  const isDesktop = useIsDesktop();
  const empty = transactions.length === 0;

  const exportJson = () => {
    const payload = { exportedAt: new Date().toISOString(), currency, categories: CATEGORIES, transactions };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-data-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported", { description: countLabel(transactions.length) });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "gap-0 overflow-y-auto border-line",
          isDesktop ? "w-[400px] sm:max-w-[400px]" : "max-h-[92dvh] rounded-t-panel",
        )}
      >
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="font-display text-xl font-semibold">Settings</SheetTitle>
          <SheetDescription>Your data is stored only in this browser.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6">
          <Section title="Currency" hint="Changes display only; no exchange-rate conversion.">
            <SegmentedControl label="Currency" className="w-full" options={CURRENCY_OPTIONS} value={currency} onValueChange={setCurrency} />
          </Section>

          <Section title="Theme">
            <SegmentedControl label="Theme" className="w-full" options={THEME_OPTIONS} value={theme} onValueChange={setTheme} />
          </Section>

          <Section title="Data" hint={empty ? "No transactions yet." : `${countLabel(transactions.length)} saved.`}>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="h-10 justify-start rounded-xl" onClick={exportJson} disabled={empty}>
                <DownloadIcon /> Export data as JSON
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={empty}
                    className="h-10 justify-start rounded-xl text-expense hover:bg-[color-mix(in_srgb,var(--expense)_8%,transparent)] hover:text-expense"
                  >
                    <Trash2Icon /> Delete all data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-panel border-line">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display text-xl">Delete all data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All {countLabel(transactions.length)} will be permanently deleted. This can’t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-full bg-expense text-white hover:bg-expense/90"
                      onClick={() => void clearAll().then(() => toast.success("All data deleted"))}
                    >
                      Delete all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-sans text-sm font-semibold text-ink">{title}</h3>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
