import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ThemePreference } from "./types";

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsDesktop = () => useMediaQuery("(min-width: 768px)");
export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** Applies the theme preference to <html>; follows the OS while set to "system". */
export function useApplyTheme(theme: ThemePreference) {
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const dark = theme === "dark" || (theme === "system" && systemDark);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#121A19" : "#EEF1EC");
  }, [dark]);
  return dark;
}

/**
 * Tracks which section is being read (for the active nav item): the lowest section whose top edge
 * has passed a line 35% down the viewport. Sections side by side (same top) resolve to the first id.
 * `ready` must turn true once the sections are in the DOM. `pin` marks a clicked item as active
 * right away and holds it while the resulting smooth scroll runs, even if the page can't scroll.
 */
export function useActiveSection(ids: string[], ready: boolean) {
  const [active, setActive] = useState(ids[0]);
  const pinnedUntil = useRef(0);
  const key = ids.join(",");

  useEffect(() => {
    if (!ready) return;
    const list = key.split(",");
    const compute = () => {
      if (performance.now() < pinnedUntil.current) return;
      const line = window.innerHeight * 0.35;
      const rects = list.map((id) => ({ id, rect: document.getElementById(id)?.getBoundingClientRect() }));
      // 1) The section under the line; side-by-side sections resolve to the first id.
      const under = rects.find(({ rect }) => rect && rect.top <= line && rect.bottom > line);
      // 2) At the very bottom, a short last section stacked below it may never reach the line.
      //    Stacked = overlapping horizontally (a side-by-side column doesn't count).
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (atBottom && under?.rect) {
        const u = under.rect;
        const below = rects.filter(
          ({ rect }) => rect && rect.top >= u.bottom - 1 && rect.bottom <= window.innerHeight && rect.left < u.right && rect.right > u.left,
        );
        if (below.length) return setActive(below[below.length - 1].id);
      }
      if (under) return setActive(under.id);
      // 3) Otherwise the last section that has scrolled past the line.
      const passed = rects.filter(({ rect }) => rect && rect.top <= line);
      setActive(passed.at(-1)?.id ?? list[0]);
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [key, ready]);

  const pin = useCallback((id: string) => {
    pinnedUntil.current = performance.now() + 1200;
    setActive(id);
  }, []);

  return [active, pin] as const;
}
