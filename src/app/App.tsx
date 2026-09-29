import { useEffect } from "react";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { SummaryStrip } from "@/components/dashboard/SummaryStrip";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { TransactionFormHost } from "@/components/transactions/TransactionFormHost";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useApplyTheme, useIsDesktop } from "@/lib/hooks";
import { useFinanceStore, useSettingsStore, useUiStore } from "@/store/useFinanceStore";
import { MobileNav, Sidebar } from "./Navigation";
import { PeriodHeader } from "./PeriodHeader";

function useAddShortcut() {
  const openCreate = useUiStore((s) => s.openCreate);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "n" && e.key !== "N") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable], [role=dialog], [role=menu], [role=listbox]")) return;
      const { form, settingsOpen } = useUiStore.getState();
      if (form.open || settingsOpen) return;
      e.preventDefault();
      openCreate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCreate]);
}

export default function App() {
  const status = useFinanceStore((s) => s.status);
  const load = useFinanceStore((s) => s.load);
  const theme = useSettingsStore((s) => s.theme);
  const dark = useApplyTheme(theme);
  const isDesktop = useIsDesktop();
  useAddShortcut();

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <TooltipProvider delayDuration={300}>
      <a
        href="#overview"
        className="sr-only z-50 rounded-full bg-brand px-4 py-2 text-on-brand focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="min-h-dvh md:pl-[72px]">
        <main className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pt-6 pb-28 md:gap-6 md:px-8 md:pt-8 md:pb-12">
          <PeriodHeader />
          {status === "ready" ? (
            <>
              <SummaryStrip />
              <CategoryBreakdown />
              <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                <TransactionList />
                <div className="lg:sticky lg:top-8">
                  <TrendChart />
                </div>
              </div>
            </>
          ) : status === "error" ? (
            <p className="panel p-6 text-sm">Couldn’t load your data. Try refreshing the page.</p>
          ) : (
            <LoadingSkeleton />
          )}
        </main>
      </div>
      <MobileNav />
      <TransactionFormHost />
      <SettingsPanel />
      <Toaster
        dark={dark}
        position={isDesktop ? "bottom-right" : "bottom-center"}
        offset={24}
        mobileOffset={{ bottom: 96 }}
      />
    </TooltipProvider>
  );
}

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex animate-pulse flex-col gap-4 md:gap-6">
      <div className="panel h-32" />
      <div className="panel h-[420px]" />
    </div>
  );
}
