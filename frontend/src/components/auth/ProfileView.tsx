"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useAuth } from "@/auth/AuthProvider"
import { useLanguage } from "@/i18n/LanguageProvider"
import type { TranslationKey } from "@/i18n/dictionaries"
import { getMyBookings } from "@/lib/api"

/** "My profile": email, editable name, number of bookings (read from our API) and logout. */
export function ProfileView() {
  const { t } = useLanguage()
  const { user, name, accessToken, updateName, signOut } = useAuth()

  const [draft, setDraft] = useState(name)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ key: TranslationKey; ok: boolean } | null>(null)
  // null = loading, -1 = the booking service could not be reached or refused the token
  const [bookings, setBookings] = useState<number | null>(null)

  useEffect(() => {
    if (!accessToken) return
    const controller = new AbortController()
    getMyBookings(accessToken, controller.signal)
      .then((list) => setBookings(list.length))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setBookings(-1)
      })
    return () => controller.abort()
  }, [accessToken])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) {
      setMessage({ key: "auth.error.missing", ok: false })
      return
    }
    setPending(true)
    setMessage(null)
    const result = await updateName(draft.trim())
    setMessage(result.error ? { key: result.error, ok: false } : { key: "profile.saved", ok: true })
    setPending(false)
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-surface p-8 shadow-card">
      <h1 className="text-2xl font-semibold">{t("profile.title")}</h1>

      <dl className="mt-6 text-sm">
        <dt className="font-medium text-subtle">{t("login.email")}</dt>
        <dd className="mt-1 text-body">{user?.email}</dd>
      </dl>

      <form onSubmit={handleSave} className="mt-4 space-y-4">
        <label className="block text-sm font-medium">
          {t("signup.name")}
          <input
            type="text"
            maxLength={150}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="mt-1 h-[52px] w-full rounded-[14px] bg-field px-4 font-normal outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        {message && (
          <p
            role={message.ok ? "status" : "alert"}
            className={
              message.ok
                ? "rounded-[10px] border border-success-border bg-success-bg px-3 py-2 text-sm text-primary"
                : "rounded-[10px] border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
            }
          >
            {t(message.key)}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="h-[48px] w-full cursor-pointer rounded-[10px] bg-primary font-bold text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? t("auth.pleaseWait") : t("profile.save")}
        </button>
      </form>

      <p className="mt-6 min-h-10 rounded-[10px] bg-warm-gray px-3 py-2 text-sm text-subtle">
        {bookings === null
          ? t("auth.pleaseWait")
          : bookings === -1
            ? t("profile.bookingsError")
            : bookings === 1
              ? t("profile.bookingsOne")
              : t("profile.bookingsCount", { n: bookings })}
      </p>

      <button
        type="button"
        onClick={signOut}
        className="mt-4 h-11 w-full cursor-pointer rounded-[10px] border border-primary font-medium text-primary transition-colors hover:bg-primary/8"
      >
        {t("nav.logout")}
      </button>
    </div>
  )
}
