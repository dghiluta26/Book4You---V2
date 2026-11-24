"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { useLanguage } from "@/i18n/LanguageProvider"
import { EMPTY_FILTERS, areDatesValid, filtersToQuery } from "@/lib/search-filters"

const GUEST_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1)

const fieldClass =
  "h-[52px] w-full rounded-[14px] bg-field px-4 text-body outline-none focus:ring-2 focus:ring-ring"

/** The cream search box floating on the hero. Submitting opens the results page. */
export function SearchBox() {
  const { t } = useLanguage()
  const router = useRouter()
  const [city, setCity] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState("")
  const [dateError, setDateError] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!areDatesValid(checkIn, checkOut)) {
      setDateError(true)
      return
    }
    const query = filtersToQuery({
      ...EMPTY_FILTERS,
      city,
      check_in: checkIn,
      check_out: checkOut,
      guests,
    })
    router.push(`/accommodations?${query}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl rounded-xl bg-cream p-4 text-left shadow-search md:p-5"
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_0.8fr_auto]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-subtle">{t("search.destination")}</span>
          <input
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder={t("search.destination")}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-subtle">{t("search.checkIn")}</span>
          <input
            type="date"
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-subtle">{t("search.checkOut")}</span>
          <input
            type="date"
            value={checkOut}
            min={checkIn || undefined}
            onChange={(event) => setCheckOut(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-subtle">{t("search.guests")}</span>
          <select value={guests} onChange={(event) => setGuests(event.target.value)} className={fieldClass}>
            <option value="">{t("search.guests")}</option>
            {GUEST_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-[52px] cursor-pointer self-end rounded-[10px] bg-primary px-8 font-bold text-cream transition-opacity hover:opacity-90"
        >
          {t("search.submit")}
        </button>
      </div>

      {dateError && (
        <p
          role="alert"
          className="mt-3 rounded-[10px] border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
        >
          {t("search.dateError")}
        </p>
      )}
    </form>
  )
}
