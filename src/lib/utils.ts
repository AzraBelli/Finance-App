import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The custom type scale (text-title, text-display) is a size, not a color; otherwise
// "text-title text-ink" would drop the size class.
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ["title", "display"] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
