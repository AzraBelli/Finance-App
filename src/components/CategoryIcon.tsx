import {
  BriefcaseBusinessIcon,
  BusIcon,
  CircleIcon,
  CoinsIcon,
  EllipsisIcon,
  HeartPulseIcon,
  HouseIcon,
  LaptopIcon,
  PopcornIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  UtensilsCrossedIcon,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  house: HouseIcon,
  "shopping-cart": ShoppingCartIcon,
  receipt: ReceiptIcon,
  bus: BusIcon,
  "utensils-crossed": UtensilsCrossedIcon,
  popcorn: PopcornIcon,
  "heart-pulse": HeartPulseIcon,
  "shopping-bag": ShoppingBagIcon,
  "briefcase-business": BriefcaseBusinessIcon,
  laptop: LaptopIcon,
  "trending-up": TrendingUpIcon,
  coins: CoinsIcon,
  ellipsis: EllipsisIcon,
};

interface CategoryIconProps {
  icon: string;
  color: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/** Category icon on a soft tint of the category color. */
export function CategoryIcon({ icon, color, className, size = "md" }: CategoryIconProps) {
  const Icon = ICONS[icon] ?? CircleIcon;
  return (
    <span
      aria-hidden
      style={{ "--c": color } as CSSProperties}
      className={cn(
        "grid shrink-0 place-items-center rounded-xl",
        "bg-[color-mix(in_srgb,var(--c)_14%,transparent)] text-[var(--c)]",
        "dark:bg-[color-mix(in_srgb,var(--c)_24%,transparent)] dark:text-[color-mix(in_srgb,var(--c)_55%,white)]",
        size === "sm" && "size-8 [&_svg]:size-4",
        size === "md" && "size-10 [&_svg]:size-5",
        size === "lg" && "size-12 [&_svg]:size-6",
        className,
      )}
    >
      <Icon strokeWidth={1.75} />
    </span>
  );
}
