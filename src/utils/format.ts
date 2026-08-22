/**
 * Currency, date and number formatting helpers.
 * All money in GigSave is stored as a numeric amount and rendered here.
 */

const CURRENCY_LOCALE: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

export function formatCurrency(value: number | null | undefined, currency = "INR"): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatCompact(value: number | null | undefined, currency = "INR"): string {
  const amount = Number(value ?? 0);
  if (Math.abs(amount) < 100000) return formatCurrency(amount, currency);
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-IN", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** ISO yyyy-mm-dd in the user's local timezone (never UTC-shifted). */
export function localISODate(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(
    "en-IN",
    opts ?? { day: "numeric", month: "short", year: "numeric" },
  ).format(date);
}

export function relativeDay(value: string): string {
  const today = localISODate();
  const yesterday = localISODate(addDays(new Date(), -1));
  if (value === today) return "Today";
  if (value === yesterday) return "Yesterday";
  return formatDate(value, { day: "numeric", month: "short" });
}

export function greeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function firstName(fullName?: string | null): string {
  if (!fullName) return "there";
  return fullName.trim().split(/\s+/)[0] || "there";
}

export function initials(fullName?: string | null): string {
  if (!fullName?.trim()) return "GS";
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
