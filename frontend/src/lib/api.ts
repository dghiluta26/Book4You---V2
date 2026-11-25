import type { AccommodationDetail, AccommodationPage } from "@/types/accommodation"
import type { Availability, Booking, BookingRequest } from "@/types/booking"
import type { ChatResponse, SearchCriteria } from "@/types/chat"
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

/** An error answered by the API; `status` tells the UI what went wrong (401, 409, 422...). */
export class ApiError extends Error {
  constructor(public status: number) {
    super(`Request failed with status ${status}`)
  }
}

async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = init
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!response.ok) throw new ApiError(response.status)
  return (await response.json()) as T
}

/** GET /accommodations/{id}/availability */
export function getAvailability(id: number, checkIn: string, checkOut: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ check_in: checkIn, check_out: checkOut })
  return request<Availability>(`/accommodations/${id}/availability?${query}`, { signal })
}

/** POST /bookings (needs a logged-in user). */
export function createBooking(token: string, booking: BookingRequest) {
  return request<Booking>("/bookings", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  })
}

/** GET /bookings/me (needs a logged-in user). */
export function getMyBookings(token: string, signal?: AbortSignal) {
  return request<Booking[]>("/bookings/me", { token, signal })
}

/** PATCH /bookings/{id}/cancel (needs a logged-in user). */
export function cancelBooking(token: string, id: number) {
  return request<Booking>(`/bookings/${id}/cancel`, { method: "PATCH", token })
}

/** POST /chat/parse: free text (RO/EN) -> editable search filters. */
export function parseChat(
  message: string,
  locale: "ro" | "en",
  previous: SearchCriteria,
  signal?: AbortSignal,
) {
  return request<ChatResponse>("/chat/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, locale, previous }),
    signal,
  })
}
