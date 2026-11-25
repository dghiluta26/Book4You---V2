"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useLanguage } from "@/i18n/LanguageProvider"
import { searchAccommodations } from "@/lib/api"
import {
  filtersFromParams,
  filtersToQuery,
  type SearchFilters,
  type SortOption,
} from "@/lib/search-filters"
import type { AccommodationPage } from "@/types/accommodation"
import { MapView } from "@/components/map/MapViewLoader"
import { cn } from "@/lib/utils"
import { AccommodationCard } from "./AccommodationCard"
import { FilterPanel } from "./FilterPanel"
import { Pagination } from "./Pagination"

type Result = { key: string; page?: AccommodationPage; failed?: boolean }

/** Filters + results. The URL is the single source of truth: changing a filter changes the URL. */
export function ResultsView() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  // Below the "xl" breakpoint the list and the map are shown one at a time.
  const [mobileView, setMobileView] = useState<"list" | "map">("list")
  // Stay highlighted in both the list and the map (hover on a card or on a marker).
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [retry, setRetry] = useState(0)

  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams])
  const queryString = filtersToQuery(filters).toString()
  const requestKey = `${queryString}#${retry}`

  // The result remembers which request it belongs to, so "loading" is simply "no result for
  // the current request yet" (no setState needed at the start of the effect).
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    searchAccommodations(filters, controller.signal)
      .then((page) => setResult({ key: requestKey, page }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setResult({ key: requestKey, failed: true })
      })
    return () => controller.abort()
    // `filters` is derived from queryString; requestKey also changes on retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  function navigate(next: SearchFilters) {
    const query = filtersToQuery(next).toString()
    router.push(query ? `/accommodations?${query}` : "/accommodations")
  }

  // Dates and guests of the search are passed on to the stay page to prefill the booking.
  const detailsQuery = new URLSearchParams(
    Object.entries({
      check_in: filters.check_in,
      check_out: filters.check_out,
      guests: filters.guests,
    }).filter(([, value]) => value),
  ).toString()

  const current = result?.key === requestKey ? result : null
  const loading = current === null

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className="mb-4 h-11 w-full cursor-pointer rounded-[10px] border border-primary font-medium text-primary lg:hidden"
        >
          {t("filters.title")}
        </button>
        <div className={showFilters ? "block" : "hidden lg:block"}>
          <FilterPanel key={queryString} filters={filters} onApply={navigate} />
        </div>
      </aside>

      <section aria-busy={loading}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="min-h-6 font-medium text-ink">
            {current?.page &&
              (current.page.total === 1
                ? t("results.foundOne")
                : t("results.found", { n: current.page.total }))}
          </p>
          <div role="group" className="flex overflow-hidden rounded-[10px] border border-primary xl:hidden">
            {(["list", "map"] as const).map((view) => (
              <button
                key={view}
                type="button"
                aria-pressed={mobileView === view}
                onClick={() => setMobileView(view)}
                className={cn(
                  "h-10 cursor-pointer px-4 text-sm font-medium transition-colors",
                  mobileView === view ? "bg-primary text-cream" : "text-primary hover:bg-primary/8",
                )}
              >
                {t(view === "list" ? "map.viewList" : "map.viewMap")}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-subtle">
            {t("sort.label")}
            <select
              value={filters.sort}
              onChange={(event) =>
                navigate({ ...filters, sort: event.target.value as SortOption, page: 1 })
              }
              className="h-10 rounded-[12px] bg-field px-3 text-body outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="price_asc">{t("sort.priceAsc")}</option>
              <option value="price_desc">{t("sort.priceDesc")}</option>
            </select>
          </label>
        </div>

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2" role="status">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-[400px] animate-pulse rounded-2xl bg-warm-gray" />
            ))}
          </div>
        )}

        {current?.failed && (
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
        )}

        {current?.page && current.page.items.length === 0 && (
          <div className="rounded-2xl bg-warm-gray p-10 text-center text-subtle">{t("results.empty")}</div>
        )}

        {current?.page && current.page.items.length > 0 && (
          <div className="xl:grid xl:grid-cols-2 xl:items-start xl:gap-6">
            <div className={cn(mobileView === "map" && "hidden xl:block")}>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {current.page.items.map((stay) => (
                  <AccommodationCard
                    key={stay.id}
                    stay={stay}
                    detailsQuery={detailsQuery}
                    highlighted={hoveredId === stay.id}
                    onHover={setHoveredId}
                  />
                ))}
              </div>
              <Pagination
                page={current.page.page}
                totalPages={current.page.total_pages}
                onChange={(page) => navigate({ ...filters, page })}
              />
            </div>
            <div className={cn(mobileView === "list" && "hidden xl:block")}>
              <div className="h-[70vh] min-h-[420px] xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:min-h-[520px]">
                <MapView
                  stays={current.page.items}
                  hoveredId={hoveredId}
                  onHover={setHoveredId}
                  detailsQuery={detailsQuery}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
