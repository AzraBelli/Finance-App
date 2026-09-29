import { ChartColumnIcon, ChartPieIcon, ListIcon, PlusIcon, SettingsIcon, type LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useActiveSection } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { useFinanceStore, useUiStore } from "@/store/useFinanceStore";

const SECTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: ChartPieIcon },
  { id: "transactions", label: "Transactions", icon: ListIcon },
  { id: "trend", label: "Trend", icon: ChartColumnIcon },
];
const SECTION_IDS = SECTIONS.map((s) => s.id);

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (id === "overview") window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

/** Active section + a click handler that marks the item active and scrolls to it. */
function useSectionNav() {
  const ready = useFinanceStore((s) => s.status === "ready");
  const [active, pin] = useActiveSection(SECTION_IDS, ready);
  const go = (id: string) => {
    pin(id);
    scrollToSection(id);
  };
  return { active, go };
}

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <circle cx="16" cy="16" r="11" fill="none" stroke="var(--line)" strokeWidth="6" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="#3C5A99" strokeWidth="6" strokeDasharray="38 69.1" transform="rotate(-90 16 16)" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="#D9A441" strokeWidth="6" strokeDasharray="14 69.1" strokeDashoffset="-40" transform="rotate(-90 16 16)" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="#C4533A" strokeWidth="6" strokeDasharray="9 69.1" strokeDashoffset="-56" transform="rotate(-90 16 16)" />
    </svg>
  );
}

/** Desktop: 72px icon rail */
export function Sidebar() {
  const { active, go } = useSectionNav();
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);

  return (
    <nav
      aria-label="Main menu"
      className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col items-center gap-2 border-r border-line bg-surface py-4 md:flex"
    >
      <div className="mb-4 grid size-10 place-items-center" title="Finance Tracker">
        <Logo className="size-8" />
      </div>
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <RailButton key={id} label={label} active={active === id} onClick={() => go(id)}>
          <Icon />
        </RailButton>
      ))}
      <div className="mt-auto">
        <RailButton label="Settings" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon />
        </RailButton>
      </div>
    </nav>
  );
}

function RailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-current={active ? "location" : undefined}
          onClick={onClick}
          className={cn(
            "relative grid size-11 place-items-center rounded-xl transition-colors [&_svg]:size-5",
            active ? "bg-soft-strong text-brand" : "text-muted-foreground hover:bg-soft hover:text-ink",
          )}
        >
          {active && <span aria-hidden className="absolute top-3 -left-[14px] h-5 w-1 rounded-full bg-brand" />}
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Mobile: bottom navigation with a fixed "Add transaction" in the middle */
export function MobileNav() {
  const { active, go } = useSectionNav();
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const openCreate = useUiStore((s) => s.openCreate);
  const [panel, list, trend] = SECTIONS;

  const item = (s: (typeof SECTIONS)[number]) => (
    <button
      key={s.id}
      type="button"
      aria-current={active === s.id ? "location" : undefined}
      onClick={() => go(s.id)}
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-xs font-medium [&_svg]:size-5",
        active === s.id ? "text-brand" : "text-muted-foreground",
      )}
    >
      <s.icon aria-hidden />
      {s.label}
    </button>
  );

  return (
    <nav
      aria-label="Main menu"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5">
        {item(panel)}
        {item(list)}
        <div className="grid place-items-center">
          <button
            type="button"
            onClick={() => openCreate()}
            aria-label="Add transaction"
            className="-mt-6 grid size-14 place-items-center rounded-full bg-brand text-on-brand shadow-[0_6px_16px_color-mix(in_srgb,var(--accent)_40%,transparent)] ring-4 ring-bg active:scale-95 [&_svg]:size-6"
          >
            <PlusIcon strokeWidth={2.25} />
          </button>
        </div>
        {item(trend)}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground [&_svg]:size-5"
        >
          <SettingsIcon aria-hidden />
          Settings
        </button>
      </div>
    </nav>
  );
}
