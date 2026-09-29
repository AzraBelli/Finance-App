import { addMonths, differenceInCalendarDays, format, getYear, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";

const locale = enUS;

export const toISODate = (date: Date) => format(date, "yyyy-MM-dd");
export const toMonthKey = (date: Date) => format(date, "yyyy-MM");
export const todayISO = () => toISODate(new Date());
export const currentMonthKey = () => toMonthKey(new Date());

/** "2026-09-14" → local midnight Date */
export const parseISODate = (iso: string) => parseISO(iso);
export const monthKeyToDate = (key: string) => parseISO(`${key}-01`);

export function shiftMonth(key: string, delta: number): string {
  return toMonthKey(addMonths(monthKeyToDate(key), delta));
}

/** "September" */
export const monthName = (date: Date) => format(date, "LLLL", { locale });

/** "2026-09" → "September 2026" */
export const formatMonthLabel = (key: string) => format(monthKeyToDate(key), "LLLL yyyy", { locale });

/** "2026-09" → "Sep" */
export const formatShortMonth = (key: string) => format(monthKeyToDate(key), "LLL", { locale });

/** "2026-07" … "2026-09" → "Jul – Sep 2026" (both years shown when they differ) */
export function formatMonthRange(startKey: string, endKey: string): string {
  const start = monthKeyToDate(startKey);
  const end = monthKeyToDate(endKey);
  if (getYear(start) === getYear(end)) {
    return `${format(start, "LLL", { locale })} – ${format(end, "LLL yyyy", { locale })}`;
  }
  return `${format(start, "LLL yyyy", { locale })} – ${format(end, "LLL yyyy", { locale })}`;
}

/** "Today", "Yesterday", "Saturday, September 12" ("…, 2025" in another year) */
export function formatDayHeading(iso: string, today: string = todayISO()): string {
  const date = parseISODate(iso);
  const diff = differenceInCalendarDays(parseISODate(today), date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  const sameYear = getYear(date) === getYear(parseISODate(today));
  return format(date, sameYear ? "EEEE, MMMM d" : "EEEE, MMMM d, yyyy", { locale });
}

/** "September 26, 2026" */
export const formatDateLong = (iso: string) => format(parseISODate(iso), "MMMM d, yyyy", { locale });
