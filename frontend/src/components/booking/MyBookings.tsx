"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@/auth/AuthProvider"
import { useLanguage } from "@/i18n/LanguageProvider"
import { cancelBooking, getMyBookings } from "@/lib/api"
import { formatAmount, formatDate, todayIso } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Booking } from "@/types/booking"

type Result = { key: string; bookings?: Booking[]; failed?: boolean }

function BookingRow({ booking, onChanged }: { booking: Booking; onChanged: (next: Booking) => void }) {
  const { t, locale } = useLanguage()
  const { accessToken } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const cancelled = booking.status === "cancelled"
  // Cancelling a stay that already ended makes no sense, so the button is hidden for those.
  const canCancel = !cancelled && booking.check_out > todayIso()
  const stay = booking.accommodation

  async function handleCancel() {
    if (!accessToken) return
    setPending(true)
    setFailed(false)
    try {
      onChanged(await cancelBooking(accessToken, booking.id))
      setConfirming(false)
    } catch {
      setFailed(true)
    }
    setPending(false)
  }

  return (
    <li
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card sm:flex-row",
        cancelled && "opacity-75",
      )}
    >
      <div className="relative h-48 w-full shrink-0 bg-muted-green sm:h-auto sm:w-56">
        {stay.thumbnail && (
          <Image src={stay.thumbnail} alt="" fill unoptimized sizes="224px" className="object-cover" />
        )}
      </div>
      <div className="flex-1 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href={`/accommodations/${stay.id}`} className="text-lg font-semibold text-ink hover:underline">
              {stay.title}
            </Link>
            <p className="text-sm text-subtle">
              {stay.city}, {stay.country}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              cancelled
                ? "border-danger-border bg-danger-bg text-danger"
                : "border-success-border bg-success-bg text-primary",
            )}
          >
            {t(cancelled ? "bookings.cancelled" : "bookings.confirmed")}
          </span>
        </div>

        <p className="mt-3 text-sm text-body">
          {formatDate(booking.check_in, locale)} – {formatDate(booking.check_out, locale)} ·{" "}
          {booking.nights} {t(booking.nights === 1 ? "booking.night" : "booking.nights")} ·{" "}
          {booking.guests} {t(booking.guests === 1 ? "card.guest" : "card.guests")}
        </p>
        <p className="mt-2 font-bold text-primary">
          {formatAmount(booking.total_price, locale)} {booking.currency}
        </p>

        {failed && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {t("auth.error.generic")}
          </p>
        )}

        {canCancel && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 h-10 cursor-pointer rounded-[10px] border border-primary px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/8"
          >
            {t("bookings.cancel")}
          </button>
        )}
        {canCancel && confirming && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-body">{t("bookings.cancelQuestion")}</span>
            <button
              type="button"
              onClick={handleCancel}
              disabled={pending}
              className="h-10 cursor-pointer rounded-[10px] border border-danger px-4 text-sm font-bold text-danger transition-opacity hover:opacity-70 disabled:opacity-50"
            >
              {pending ? t("auth.pleaseWait") : t("bookings.cancelYes")}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="h-10 cursor-pointer rounded-[10px] px-4 text-sm font-medium text-primary hover:bg-primary/8"
            >
              {t("bookings.cancelNo")}
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

/** Booking history with cancellation. */
export function MyBookings() {
  const { t } = useLanguage()
  const { accessToken } = useAuth()
  const [retry, setRetry] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const key = `${retry}`

  // Runs again every time the page is shown, so a new booking appears right away.
  useEffect(() => {
    if (!accessToken) return
    const controller = new AbortController()
    getMyBookings(accessToken, controller.signal)
      .then((bookings) => setResult({ key, bookings }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setResult({ key, failed: true })
      })
    return () => controller.abort()
  }, [accessToken, key])

  const current = result?.key === key ? result : null

  function replace(next: Booking) {
    setResult((previous) =>
      previous?.bookings
        ? { ...previous, bookings: previous.bookings.map((item) => (item.id === next.id ? next : item)) }
        : previous,
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-semibold">{t("bookings.title")}</h1>

      {!current && (
        <div className="mt-8 space-y-4" role="status">
          <div className="h-40 animate-pulse rounded-2xl bg-warm-gray" />
          <div className="h-40 animate-pulse rounded-2xl bg-warm-gray" />
        </div>
      )}

      {current?.failed && (
        <div role="alert" className="mt-8 rounded-2xl border border-danger-border bg-danger-bg p-6 text-danger">
          <p>{t("profile.bookingsError")}</p>
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="mt-4 h-10 cursor-pointer rounded-[10px] border border-danger px-4 font-medium transition-opacity hover:opacity-70"
          >
            {t("results.retry")}
          </button>
        </div>
      )}

      {current?.bookings?.length === 0 && (
        <div className="mt-8 rounded-2xl bg-warm-gray p-10 text-center">
          <p className="text-subtle">{t("bookings.empty")}</p>
          <Link
            href="/accommodations"
            className="mt-6 inline-block rounded-[10px] bg-primary px-6 py-3 font-bold text-cream transition-opacity hover:opacity-90"
          >
            {t("bookings.browse")}
          </Link>
        </div>
      )}

      {current?.bookings && current.bookings.length > 0 && (
        <ul className="mt-8 space-y-5">
          {current.bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} onChanged={replace} />
          ))}
        </ul>
      )}
    </div>
  )
}
