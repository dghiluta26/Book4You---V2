"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { useAuth } from "@/auth/AuthProvider"
import { useLanguage } from "@/i18n/LanguageProvider"
import type { TranslationKey } from "@/i18n/dictionaries"
import { ApiError, createBooking, getAvailability } from "@/lib/api"
import { formatAmount, formatDate, todayIso } from "@/lib/format"
import { areDatesValid } from "@/lib/search-filters"
import type { AccommodationDetail } from "@/types/accommodation"
import type { Availability, Booking } from "@/types/booking"

type Step = "select" | "review" | "done"

const fieldClass =
  "mt-1 h-11 w-full rounded-[12px] bg-field px-3 text-sm font-normal text-body outline-none focus:ring-2 focus:ring-ring"
const primaryClass =
  "flex h-12 w-full cursor-pointer items-center justify-center rounded-[10px] bg-primary font-bold text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
const errorClass = "rounded-[10px] border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
const successClass =
  "rounded-[10px] border border-success-border bg-success-bg px-3 py-2 text-sm text-primary"

function bookingErrorKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) {
    if (error.status === 409) return "booking.error.taken"
    if (error.status === 422) return "booking.error.invalid"
    if (error.status === 401) return "booking.error.session"
  }
  return "auth.error.generic"
}

/**
 * Checkout in 3 steps on the stay page: 1) choose dates and guests (availability is checked live),
 * 2) review, 3) confirmation. The booking is simulated: there is no payment.
 */
export function BookingCard({ stay }: { stay: AccommodationDetail }) {
  const { t, locale } = useLanguage()
  const { status, accessToken } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Dates and guests can arrive in the URL (from a search, or after logging in).
  const [checkIn, setCheckIn] = useState(searchParams.get("check_in") ?? "")
  const [checkOut, setCheckOut] = useState(searchParams.get("check_out") ?? "")
  const [guests, setGuests] = useState(() => {
    const wanted = Number(searchParams.get("guests"))
    return Number.isInteger(wanted) && wanted >= 1 ? Math.min(wanted, stay.capacity) : 1
  })

  const [step, setStep] = useState<Step>("select")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<TranslationKey | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [recheck, setRecheck] = useState(0)

  // The page stays alive after navigating away: start again from step 1 next time.
  useEffect(
    () => () => {
      setStep("select")
      setError(null)
    },
    [],
  )

  // ---- live availability check ----
  const datesFilled = Boolean(checkIn && checkOut)
  const datesValid = datesFilled && areDatesValid(checkIn, checkOut)
  const key = `${checkIn}|${checkOut}|${recheck}`
  const [checked, setChecked] = useState<{ key: string; result?: Availability; failed?: boolean }>()

  useEffect(() => {
    if (!datesValid) return
    const controller = new AbortController()
    getAvailability(stay.id, checkIn, checkOut, controller.signal)
      .then((result) => setChecked({ key, result }))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return
        setChecked({ key, failed: true })
      })
    return () => controller.abort()
  }, [stay.id, checkIn, checkOut, datesValid, key])

  const current = datesValid && checked?.key === key ? checked : undefined
  const availability = current?.result

  function change(setter: (value: string) => void, value: string) {
    setter(value)
    setError(null)
  }

  function handleReview(event: FormEvent) {
    event.preventDefault()
    if (availability?.available) setStep("review")
  }

  async function handleConfirm() {
    if (!accessToken) return
    setPending(true)
    setError(null)
    try {
      const created = await createBooking(accessToken, {
        accommodation_id: stay.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
      })
      setBooking(created)
      setStep("done")
    } catch (reason) {
      setError(bookingErrorKey(reason))
      setStep("select")
      setRecheck((value) => value + 1) // the dates may have just been taken
    }
    setPending(false)
  }

  // Where to come back to after logging in, keeping the chosen dates.
  const returnQuery = new URLSearchParams()
  if (checkIn) returnQuery.set("check_in", checkIn)
  if (checkOut) returnQuery.set("check_out", checkOut)
  returnQuery.set("guests", String(guests))
  const loginHref = `/login?next=${encodeURIComponent(`${pathname}?${returnQuery}`)}`

  const nightsText = (nights: number) =>
    `${nights} ${t(nights === 1 ? "booking.night" : "booking.nights")}`
  const guestsText = (count: number) => `${count} ${t(count === 1 ? "card.guest" : "card.guests")}`

  const summaryRow = (label: string, value: string, strong = false) => (
    <div className="flex justify-between gap-4">
      <dt className="text-subtle">{label}</dt>
      <dd className={strong ? "font-bold text-primary" : "text-right text-body"}>{value}</dd>
    </div>
  )

  return (
    <div className="rounded-2xl bg-surface p-6 shadow-card lg:sticky lg:top-6">
      <p className="text-primary">
        <span className="text-3xl font-bold">
          {formatAmount(stay.price_per_night, locale)} {stay.currency}
        </span>{" "}
        <span className="text-subtle">{t("card.perNight")}</span>
      </p>
      <p className="mt-3 text-xs font-medium text-subtle">
        {t("booking.step", { n: step === "select" ? 1 : step === "review" ? 2 : 3 })}
      </p>

      {step === "select" && (
        <form onSubmit={handleReview} className="mt-3 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-subtle">
              {t("search.checkIn")}
              <input
                type="date"
                value={checkIn}
                min={todayIso()}
                onChange={(event) => change(setCheckIn, event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-xs font-medium text-subtle">
              {t("search.checkOut")}
              <input
                type="date"
                value={checkOut}
                min={checkIn || todayIso()}
                onChange={(event) => change(setCheckOut, event.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block text-xs font-medium text-subtle">
            {t("search.guests")}
            <select
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
              className={fieldClass}
            >
              {Array.from({ length: stay.capacity }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <div aria-live="polite" className="min-h-[44px]">
            {error && <p className={`${errorClass} mb-2`}>{t(error)}</p>}
            {!datesFilled && <p className="text-sm text-subtle">{t("booking.chooseDates")}</p>}
            {datesFilled && !datesValid && <p className={errorClass}>{t("search.dateError")}</p>}
            {datesValid && !current && <p className="text-sm text-subtle">{t("booking.checking")}</p>}
            {current?.failed && <p className={errorClass}>{t("booking.error.check")}</p>}
            {availability?.available && (
              <p className={successClass}>
                {t("booking.available")} {nightsText(availability.nights)} ·{" "}
                <strong>
                  {formatAmount(availability.total_price, locale)} {availability.currency}
                </strong>
              </p>
            )}
            {availability && !availability.available && !error && (
              <p className={errorClass}>
                {t(availability.reason === "past" ? "booking.past" : "booking.unavailable")}
              </p>
            )}
          </div>

          {status === "signedOut" ? (
            <Link href={loginHref} className={primaryClass}>
              {t("booking.loginToBook")}
            </Link>
          ) : (
            <button
              type="submit"
              disabled={status !== "signedIn" || !availability?.available}
              className={primaryClass}
            >
              {t("details.book")}
            </button>
          )}
        </form>
      )}

      {step === "review" && availability && (
        <div className="mt-3 space-y-4">
          <h2 className="text-lg font-semibold">{t("booking.reviewTitle")}</h2>
          <dl className="space-y-2 rounded-xl bg-warm-gray p-4 text-sm">
            {summaryRow(t("search.checkIn"), formatDate(checkIn, locale))}
            {summaryRow(t("search.checkOut"), formatDate(checkOut, locale))}
            {summaryRow(t("search.guests"), guestsText(guests))}
            {summaryRow(t("booking.duration"), nightsText(availability.nights))}
            {summaryRow(
              t("booking.total"),
              `${formatAmount(availability.total_price, locale)} ${availability.currency}`,
              true,
            )}
          </dl>
          <p className="text-xs text-subtle">{t("booking.simulated")}</p>
          <button type="button" onClick={handleConfirm} disabled={pending} className={primaryClass}>
            {pending ? t("auth.pleaseWait") : t("booking.confirm")}
          </button>
          <button
            type="button"
            onClick={() => setStep("select")}
            disabled={pending}
            className="h-11 w-full cursor-pointer rounded-[10px] border border-primary font-medium text-primary transition-colors hover:bg-primary/8 disabled:opacity-50"
          >
            {t("booking.back")}
          </button>
        </div>
      )}

      {step === "done" && booking && (
        <div className="mt-3 space-y-4">
          <p role="status" className={successClass}>
            <strong>{t("booking.doneTitle")}</strong>
            <br />
            {formatDate(booking.check_in, locale)} – {formatDate(booking.check_out, locale)} ·{" "}
            {formatAmount(booking.total_price, locale)} {booking.currency}
          </p>
          <Link href="/bookings" className={primaryClass}>
            {t("booking.viewMine")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setStep("select")
              setCheckIn("")
              setCheckOut("")
            }}
            className="h-11 w-full cursor-pointer rounded-[10px] border border-primary font-medium text-primary transition-colors hover:bg-primary/8"
          >
            {t("booking.another")}
          </button>
        </div>
      )}
    </div>
  )
}
