import type { AccommodationDetail, AccommodationPage } from "@/types/accommodation"
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

/** Thrown when the backend answers 404, so the UI can show "stay not found" instead of an error. */
export class NotFoundError extends Error {}

/** GET /accommodations/{id}. */
export async function getAccommodation(id: string, signal?: AbortSignal): Promise<AccommodationDetail> {
  const response = await fetch(`${API_URL}/accommodations/${encodeURIComponent(id)}`, { signal })
  if (response.status === 404 || response.status === 422) throw new NotFoundError(id)
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return (await response.json()) as AccommodationDetail
}

/** GET /bookings/me (needs a logged-in user). */
export async function getMyBookings(token: string, signal?: AbortSignal): Promise<{ id: number }[]> {
  const response = await fetch(`${API_URL}/bookings/me`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return (await response.json()) as { id: number }[]
}
