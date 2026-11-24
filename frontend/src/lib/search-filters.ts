import { ACCOMMODATION_TYPES, type AccommodationType } from "@/types/accommodation"

export type SortOption = "price_asc" | "price_desc"

/** The search filters. They live in the URL, so a search can be shared and the back button works. */
export type SearchFilters = {
  city: string
  check_in: string
  check_out: string
  guests: string
  min_price: string
  max_price: string
  types: AccommodationType[]
  sort: SortOption
  page: number
}

export const PAGE_SIZE = 12

export const EMPTY_FILTERS: SearchFilters = {
  city: "",
  check_in: "",
  check_out: "",
  guests: "",
  min_price: "",
  max_price: "",
  types: [],
  sort: "price_asc",
  page: 1,
}

type ParamsLike = { get(name: string): string | null; getAll(name: string): string[] }

/** Read filters from the URL query string. Unknown or invalid values are ignored. */
export function filtersFromParams(params: ParamsLike): SearchFilters {
  const page = Number(params.get("page"))
  const sort = params.get("sort")
  return {
    city: params.get("city") ?? "",
    check_in: params.get("check_in") ?? "",
    check_out: params.get("check_out") ?? "",
    guests: params.get("guests") ?? "",
    min_price: params.get("min_price") ?? "",
    max_price: params.get("max_price") ?? "",
    types: params
      .getAll("type")
      .filter((value): value is AccommodationType =>
        (ACCOMMODATION_TYPES as readonly string[]).includes(value),
      ),
    sort: sort === "price_desc" ? "price_desc" : "price_asc",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

/** Build a query string. Empty values and defaults are left out to keep URLs short. */
export function filtersToQuery(filters: SearchFilters): URLSearchParams {
  const query = new URLSearchParams()
  const text = {
    city: filters.city.trim(),
    check_in: filters.check_in,
    check_out: filters.check_out,
    guests: filters.guests,
    min_price: filters.min_price,
    max_price: filters.max_price,
  }
  for (const [key, value] of Object.entries(text)) {
    if (value) query.set(key, value)
  }
  filters.types.forEach((type) => query.append("type", type))
  if (filters.sort !== "price_asc") query.set("sort", filters.sort)
  if (filters.page > 1) query.set("page", String(filters.page))
  return query
}

/** Both dates or none; check-out must be after check-in (ISO dates compare as text). */
export function areDatesValid(checkIn: string, checkOut: string): boolean {
  if (!checkIn && !checkOut) return true
  return Boolean(checkIn && checkOut && checkOut > checkIn)
}
