// Shapes returned by the FastAPI backend (see docs/api.md).

export const ACCOMMODATION_TYPES = [
  "apartment",
  "house",
  "cabin",
  "villa",
  "hotel",
  "hostel",
  "room",
] as const

export type AccommodationType = (typeof ACCOMMODATION_TYPES)[number]

export type AccommodationSummary = {
  id: number
  title: string
  type: AccommodationType
  city: string
  country: string
  latitude: number
  longitude: number
  price_per_night: number
  currency: string
  capacity: number
  bedrooms: number | null
  bathrooms: number | null
  thumbnail: string | null
}

export type AccommodationPage = {
  items: AccommodationSummary[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export type Amenity = {
  slug: string
  name_en: string
  name_ro: string
}

export type AccommodationImage = {
  url: string
  position: number
}

export type AccommodationDetail = AccommodationSummary & {
  description: string | null
  address: string | null
  images: AccommodationImage[]
  amenities: Amenity[]
}
