import { EMPTY_FILTERS, areDatesValid, type SearchFilters, type SortOption } from "@/lib/search-filters"
import type { SearchCriteria } from "@/types/chat"

/** A number from a URL value, or null if it is not within the limits the API accepts. */
function bounded(value: string, min: number, max: number): number | null {
  const number = Number(value)
  return value !== "" && Number.isFinite(number) && number >= min && number <= max ? number : null
}

/** URL filters -> chat criteria (what the chips show and what is sent as "previous"). */
export function criteriaFromFilters(filters: SearchFilters, activities: string[]): SearchCriteria {
  const datesOk = Boolean(filters.check_in && filters.check_out) &&
    areDatesValid(filters.check_in, filters.check_out)
  const guests = bounded(filters.guests, 1, 20)
  return {
    destination: filters.city.trim().slice(0, 100) || null,
    check_in: datesOk ? filters.check_in : null,
    check_out: datesOk ? filters.check_out : null,
    guests: guests === null ? null : Math.floor(guests),
    min_price: bounded(filters.min_price, 0, 100_000),
    max_price: bounded(filters.max_price, 0, 100_000),
    types: filters.types,
    activities,
  }
}

/** Chat criteria -> URL filters. Changing the URL is what reruns the search. */
export function filtersFromCriteria(criteria: SearchCriteria, sort: SortOption): SearchFilters {
  const text = (value: string | number | null) => (value === null ? "" : String(value))
  return {
    ...EMPTY_FILTERS,
    sort,
    city: text(criteria.destination),
    check_in: text(criteria.check_in),
    check_out: text(criteria.check_out),
    guests: text(criteria.guests),
    min_price: text(criteria.min_price),
    max_price: text(criteria.max_price),
    types: criteria.types,
  }
}
