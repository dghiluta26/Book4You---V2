import type { Locale } from "@/i18n/dictionaries"
import type { AccommodationType } from "@/types/accommodation"

/** The filters understood from the conversation (same shape as the API). */
export type SearchCriteria = {
  destination: string | null
  check_in: string | null
  check_out: string | null
  guests: number | null
  min_price: number | null
  max_price: number | null
  types: AccommodationType[]
  activities: string[]
}

export type ChatResponse = {
  criteria: SearchCriteria
  missing: "destination"[]
  clarification: string | null
  language: Locale
  source: "llm" | "fallback"
  warnings: ("dates_ignored" | "llm_unavailable")[]
}
