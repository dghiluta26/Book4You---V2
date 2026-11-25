"use client"

import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { useLanguage } from "@/i18n/LanguageProvider"
import type { AccommodationSummary } from "@/types/accommodation"

// Default view when there is nothing to show: all of Romania.
const ROMANIA_CENTER: L.LatLngExpression = [45.9, 25.0]
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

type Props = {
  stays: AccommodationSummary[]
  /** Stay highlighted from the outside (hovering its card in the list). */
  hoveredId?: number | null
  /** Called when the mouse enters or leaves a marker, so the list can highlight the card. */
  onHover?: (id: number | null) => void
  /** Query string added to the popup links (search dates and guests). */
  detailsQuery?: string
  /** Hide popups (used on the details page, where there is a single stay). */
  showPopups?: boolean
  className?: string
}

type MarkerEntry = { id: number; marker: L.Marker }

/** A marker shaped like a green pill with the price. */
function priceIcon(price: number) {
  return L.divIcon({
    className: "b4y-marker-wrapper",
    html: `<span class="b4y-marker">${Math.round(price)}</span>`,
    iconSize: [0, 0],
  })
}

/** Popup content is built with DOM calls (textContent), so API text can never inject HTML. */
function buildPopup(
  stay: AccommodationSummary,
  texts: { price: string; perNight: string; link: string },
  open: (href: string) => void,
  query?: string,
): HTMLElement {
  const text = (tag: string, className: string, content: string) => {
    const element = document.createElement(tag)
    element.className = className
    element.textContent = content
    return element
  }
  const root = document.createElement("div")
  root.append(
    text("p", "m-0 font-semibold text-ink", stay.title),
    text("p", "m-0 text-subtle", stay.city),
  )
  const price = text("p", "m-0 mt-1 font-bold text-primary", `${texts.price} ${stay.currency} `)
  price.append(text("span", "font-normal text-subtle", texts.perNight))
  root.append(price)

  const href = `/accommodations/${stay.id}${query ? `?${query}` : ""}`
  const link = text("a", "mt-2 inline-block font-semibold text-primary underline", texts.link)
  link.setAttribute("href", href)
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return // let "open in new tab" work
    event.preventDefault()
    open(href) // client-side navigation, like a normal Next.js link
  })
  root.append(link)
  return root
}

/**
 * Leaflet map managed directly (no wrapper library). The map is created in an effect and is
 * ALWAYS destroyed in that effect's cleanup, so it survives React StrictMode, hot reload and
 * the page being hidden/shown again when navigating back.
 */
export default function MapView({
  stays,
  hoveredId,
  onHover,
  detailsQuery,
  showPopups = true,
  className,
}: Props) {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const entriesRef = useRef<MarkerEntry[]>([])

  // 1) The map itself.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = L.map(container, { center: ROMANIA_CENTER, zoom: 6, scrollWheelZoom: false })
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map)
    mapRef.current = map

    // The map can be hidden on small screens until the user opens it: re-measure on resize.
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      entriesRef.current = []
    }
  }, [])

  // 2) The markers (and zoom to fit them) whenever the stays change.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const priceFormat = new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-GB", {
      maximumFractionDigits: 0,
    })

    const entries: MarkerEntry[] = stays.map((stay) => {
      const marker = L.marker([stay.latitude, stay.longitude], {
        icon: priceIcon(stay.price_per_night),
        title: stay.title,
      }).addTo(map)
      marker.on("mouseover", () => onHover?.(stay.id))
      marker.on("mouseout", () => onHover?.(null))
      if (showPopups) {
        marker.bindPopup(
          buildPopup(
            stay,
            {
              price: priceFormat.format(stay.price_per_night),
              perNight: t("card.perNight"),
              link: t("map.viewDetails"),
            },
            (href) => router.push(href),
            detailsQuery,
          ),
        )
      }
      return { id: stay.id, marker }
    })
    entriesRef.current = entries

    if (stays.length === 0) {
      map.setView(ROMANIA_CENTER, 6)
    } else {
      const bounds = L.latLngBounds(stays.map((stay) => [stay.latitude, stay.longitude]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
    }

    return () => {
      entries.forEach((entry) => entry.marker.remove())
      entriesRef.current = []
    }
  }, [stays, showPopups, onHover, router, t, locale, detailsQuery])

  // 3) Highlight the hovered stay. Only a CSS class is toggled, so the marker element under the
  //    mouse is never replaced (which would make the highlight flicker).
  useEffect(() => {
    for (const entry of entriesRef.current) {
      const active = entry.id === hoveredId
      entry.marker.getElement()?.querySelector(".b4y-marker")?.classList.toggle("b4y-marker--active", active)
      entry.marker.setZIndexOffset(active ? 1000 : 0)
    }
  })

  return <div ref={containerRef} className={className ?? "h-full w-full rounded-2xl"} />
}
