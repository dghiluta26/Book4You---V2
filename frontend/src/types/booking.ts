import type { AccommodationSummary } from "@/types/accommodation"

export type Availability = {
  available: boolean
  nights: number
  total_price: number
  currency: string
  reason: "booked" | "past" | null
}

export type Booking = {
  id: number
  accommodation: AccommodationSummary
  check_in: string
  check_out: string
  nights: number
  guests: number
  total_price: number
  currency: string
  status: "confirmed" | "cancelled"
  created_at: string
  cancelled_at: string | null
}

export type BookingRequest = {
  accommodation_id: number
  check_in: string
  check_out: string
  guests: number
}
