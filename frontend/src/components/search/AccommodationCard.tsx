"use client"

import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/i18n/LanguageProvider"
import type { TranslationKey } from "@/i18n/dictionaries"
import { cn } from "@/lib/utils"
import type { AccommodationSummary } from "@/types/accommodation"

type Props = {
  stay: AccommodationSummary
  /** Highlighted while its marker is hovered on the map. */
  highlighted?: boolean
  /** Called when the mouse enters or leaves the card, so the map can highlight the marker. */
  onHover?: (id: number | null) => void
}

/** White card, 18px radius, lifts on hover, 240px photo with the type badge on top. */
export function AccommodationCard({ stay, highlighted = false, onHover }: Props) {
  const { t, locale } = useLanguage()

  const guests = `${stay.capacity} ${t(stay.capacity === 1 ? "card.guest" : "card.guests")}`
  const bedrooms =
    stay.bedrooms != null
      ? `${stay.bedrooms} ${t(stay.bedrooms === 1 ? "card.bedroom" : "card.bedrooms")}`
      : null
  const price = new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-GB", {
    maximumFractionDigits: 0,
  }).format(stay.price_per_night)

  return (
    <Link
      href={`/accommodations/${stay.id}`}
      onMouseEnter={() => onHover?.(stay.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        "group block overflow-hidden rounded-2xl bg-surface shadow-card transition-all duration-200 hover:-translate-y-[5px] hover:shadow-card-hover",
        highlighted && "-translate-y-[5px] shadow-card-hover ring-2 ring-primary",
      )}
    >
      <div className="relative h-[240px] w-full bg-muted-green">
        {stay.thumbnail && (
          <Image
            src={stay.thumbnail}
            alt={stay.title}
            fill
            unoptimized
            sizes="(min-width: 1536px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-primary/95 px-3 py-1 text-xs font-medium text-cream">
          {t(`type.${stay.type}` as TranslationKey)}
        </span>
      </div>

      <div className="p-5">
        <h3 className="line-clamp-2 text-lg font-semibold text-ink">{stay.title}</h3>
        <p className="mt-1 text-sm text-subtle">
          {stay.city}, {stay.country}
        </p>
        <p className="mt-1 text-sm text-subtle">{[guests, bedrooms].filter(Boolean).join(" · ")}</p>
        <p className="mt-4 text-primary">
          <span className="text-xl font-bold">
            {price} {stay.currency}
          </span>{" "}
          <span className="text-sm font-normal text-subtle">{t("card.perNight")}</span>
        </p>
      </div>
    </Link>
  )
}
