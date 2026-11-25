"use client"

import { ArrowLeft, Bath, BedDouble, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { BookingCard } from "@/components/booking/BookingCard"
import { NotFoundView } from "@/components/layout/NotFoundView"
import { MapView } from "@/components/map/MapViewLoader"
import { useLanguage } from "@/i18n/LanguageProvider"
import type { TranslationKey } from "@/i18n/dictionaries"
import { NotFoundError, getAccommodation } from "@/lib/api"
import type { AccommodationDetail } from "@/types/accommodation"
import { Gallery } from "./Gallery"

type Result = { key: string; stay?: AccommodationDetail; status?: "notFound" | "error" }

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 rounded-full bg-muted-green px-4 py-2 text-sm text-primary">
      {icon}
      {children}
    </li>
  )
}

/** Details page of one stay: photos, facts, description, amenities, map and the booking card. */
export function AccommodationDetails() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { t, locale } = useLanguage()
  const [retry, setRetry] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const requestKey = `${id}#${retry}`

  useEffect(() => {
    const controller = new AbortController()
    getAccommodation(id, controller.signal)
      .then((stay) => setResult({ key: requestKey, stay }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setResult({ key: requestKey, status: error instanceof NotFoundError ? "notFound" : "error" })
      })
    return () => controller.abort()
  }, [id, requestKey])

  const current = result?.key === requestKey ? result : null
  const stay = current?.stay
  const mapStays = useMemo(() => (stay ? [stay] : []), [stay])

  if (!current) {
    return (
      <div className="animate-pulse space-y-6" role="status">
        <div className="h-8 w-1/2 rounded-xl bg-warm-gray" />
        <div className="aspect-[16/10] max-h-[520px] w-full rounded-2xl bg-warm-gray" />
      </div>
    )
  }
  if (current.status === "notFound") return <NotFoundView kind="stay" />
  if (!stay) {
    return (
      <div role="alert" className="rounded-2xl border border-danger-border bg-danger-bg p-6 text-danger">
        <p>{t("results.error")}</p>
        <button
          type="button"
          onClick={() => setRetry((value) => value + 1)}
          className="mt-4 h-10 cursor-pointer rounded-[10px] border border-danger px-4 font-medium transition-opacity hover:opacity-70"
        >
          {t("results.retry")}
        </button>
      </div>
    )
  }

  return (
    <div>
      <Link href="/accommodations" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" />
        {t("details.back")}
      </Link>

      <header className="mt-4 mb-6">
        <span className="rounded-full bg-primary/95 px-3 py-1 text-xs font-medium text-cream">
          {t(`type.${stay.type}` as TranslationKey)}
        </span>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{stay.title}</h1>
        <p className="mt-2 flex items-center gap-2 text-subtle">
          <MapPin className="size-4" />
          {[stay.address, stay.city, stay.country].filter(Boolean).join(", ")}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <Gallery key={stay.id} images={stay.images} title={stay.title} />

          <ul className="flex flex-wrap gap-3">
            <Fact icon={<Users className="size-4" />}>
              {stay.capacity} {t(stay.capacity === 1 ? "card.guest" : "card.guests")}
            </Fact>
            {stay.bedrooms != null && (
              <Fact icon={<BedDouble className="size-4" />}>
                {stay.bedrooms} {t(stay.bedrooms === 1 ? "card.bedroom" : "card.bedrooms")}
              </Fact>
            )}
            {stay.bathrooms != null && (
              <Fact icon={<Bath className="size-4" />}>
                {stay.bathrooms} {t(stay.bathrooms === 1 ? "details.bathroom" : "details.bathrooms")}
              </Fact>
            )}
          </ul>

          <section>
            <h2 className="mb-3 text-xl font-semibold">{t("details.about")}</h2>
            <p className="leading-relaxed text-body">{stay.description ?? t("details.noDescription")}</p>
          </section>

          {stay.amenities.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-semibold">{t("details.amenities")}</h2>
              <ul className="flex flex-wrap gap-2">
                {stay.amenities.map((amenity) => (
                  <li key={amenity.slug} className="rounded-full bg-muted-green px-4 py-2 text-sm text-primary">
                    {locale === "ro" ? amenity.name_ro : amenity.name_en}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-xl font-semibold">{t("details.location")}</h2>
            <div className="h-[340px] overflow-hidden rounded-2xl">
              <MapView stays={mapStays} showPopups={false} />
            </div>
          </section>
        </div>

        <aside>
          {/* The key starts a fresh checkout for another stay or another set of dates */}
          <BookingCard key={`${stay.id}?${searchParams}`} stay={stay} />
        </aside>
      </div>
    </div>
  )
}
