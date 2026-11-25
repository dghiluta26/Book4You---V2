"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { useAuth } from "@/auth/AuthProvider"
import { safeRedirectPath } from "@/auth/redirect"
import { useLanguage } from "@/i18n/LanguageProvider"
import type { TranslationKey } from "@/i18n/dictionaries"
import { isSupabaseConfigured } from "@/lib/supabase"

type Mode = "login" | "signup"

const MIN_PASSWORD = 6

const fieldClass =
  "mt-1 h-[52px] w-full rounded-[14px] bg-field px-4 font-normal text-body outline-none focus:ring-2 focus:ring-ring"

const errorClass = "rounded-[10px] border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"

const successClass =
  "rounded-[10px] border border-success-border bg-success-bg px-3 py-2 text-sm text-primary"

/** Login and signup form, connected to Supabase Auth. */
export function AuthForm({ mode }: { mode: Mode }) {
  const { t } = useLanguage()
  const { status, signIn, signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next")
  const target = safeRedirectPath(next)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<TranslationKey | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  const isSignup = mode === "signup"

  // Already logged in (or just logged in): leave this page.
  useEffect(() => {
    if (status === "signedIn") router.replace(target)
  }, [status, target, router])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setCheckEmail(false)

    if (!email.trim() || !password || (isSignup && !name.trim())) {
      setError("auth.error.missing")
      return
    }
    if (isSignup && password.length < MIN_PASSWORD) {
      setError("auth.error.weakPassword")
      return
    }

    setPending(true)
    if (isSignup) {
      const result = await signUp(name.trim(), email.trim(), password)
      if (result.error) setError(result.error)
      else {
        // The page stays alive in the background after navigating: do not keep the password.
        setPassword("")
        if (result.needsConfirmation) setCheckEmail(true)
      }
    } else {
      const result = await signIn(email.trim(), password)
      if (result.error) setError(result.error)
      else setPassword("")
    }
    setPending(false)
  }

  const otherPage = isSignup ? "/login" : "/signup"
  const otherHref = next ? `${otherPage}?next=${encodeURIComponent(target)}` : otherPage

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-surface p-8 shadow-card">
      <h1 className="text-2xl font-semibold">{t(isSignup ? "signup.title" : "login.title")}</h1>
      <p className="mt-1 text-sm text-subtle">{t(isSignup ? "signup.subtitle" : "login.subtitle")}</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        {isSignup && (
          <label className="block text-sm font-medium">
            {t("signup.name")}
            <input
              type="text"
              autoComplete="name"
              maxLength={150}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
            />
          </label>
        )}
        <label className="block text-sm font-medium">
          {t("login.email")}
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-medium">
          {t("login.password")}
          <input
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClass}
          />
          {isSignup && (
            <span className="mt-1 block text-xs font-normal text-subtle">
              {t("signup.passwordHint", { n: MIN_PASSWORD })}
            </span>
          )}
        </label>

        {!isSupabaseConfigured && <p className={errorClass}>{t("auth.error.notConfigured")}</p>}
        {error && (
          <p role="alert" className={errorClass}>
            {t(error, { n: MIN_PASSWORD })}
          </p>
        )}
        {checkEmail && (
          <p role="status" className={successClass}>
            {t("signup.checkEmail")}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !isSupabaseConfigured}
          className="h-[48px] w-full cursor-pointer rounded-[10px] bg-primary font-bold text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? t("auth.pleaseWait") : t(isSignup ? "signup.submit" : "login.submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-subtle">
        {t(isSignup ? "signup.haveAccount" : "login.noAccount")}{" "}
        <Link href={otherHref} className="font-semibold text-primary hover:underline">
          {t(isSignup ? "nav.login" : "nav.signup")}
        </Link>
      </p>
    </div>
  )
}
