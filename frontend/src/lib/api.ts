import type { AccommodationPage } from "@/types/accommodation"
import { PAGE_SIZE, type SearchFilters, filtersToQuery } from "@/lib/search-filters"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

/** GET /accommodations with the current filters. Throws if the backend is unreachable or fails. */
export async function searchAccommodations(
  filters: SearchFilters,
  signal?: AbortSignal,
): Promise<AccommodationPage> {
  const query = filtersToQuery(filters)
  query.set("page_size", String(PAGE_SIZE))
  const response = await fetch(`${API_URL}/accommodations?${query}`, { signal })
  if (!response.ok) throw new Error(`Search failed with status ${response.status}`)
  return (await response.json()) as AccommodationPage
}
