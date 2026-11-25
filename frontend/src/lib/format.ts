import type { Locale } from "@/i18n/dictionaries"

const intlLocale = (locale: Locale) => (locale === "ro" ? "ro-RO" : "en-GB")

/** 1560 -> "1.560" (RO) or "1,560" (EN). */
export function formatAmount(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 }).format(value)
}

/** "2026-12-04" -> "4 dec. 2026" / "4 Dec 2026". Parsed as a local date, so the day never shifts. */
export function formatDate(isoDate: string, locale: Locale): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day))
}

/** Today in the user's time zone, as "YYYY-MM-DD" (call only in the browser). */
export function todayIso(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
