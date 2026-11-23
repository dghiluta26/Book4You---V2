"use client"

import Link from "next/link"
import { useLanguage } from "@/i18n/LanguageProvider"
import type { TranslationKey } from "@/i18n/dictionaries"

type Mode = "login" | "signup"

const copy: Record<
  Mode,
  { title: TranslationKey; subtitle: TranslationKey; submit: TranslationKey; switchText: TranslationKey; switchLink: TranslationKey; switchHref: string }
> = {
  login: {
    title: "login.title",
    subtitle: "login.subtitle",
    submit: "login.submit",
    switchText: "login.noAccount",
    switchLink: "nav.signup",
    switchHref: "/signup",
  },
  signup: {
    title: "signup.title",
    subtitle: "signup.subtitle",
    submit: "signup.submit",
    switchText: "signup.haveAccount",
    switchLink: "nav.login",
    switchHref: "/login",
  },
}

/** Static login/signup form. It is wired to Supabase Auth in Step 7. */
export function AuthForm({ mode }: { mode: Mode }) {
  const { t } = useLanguage()
  const c = copy[mode]
  const fieldClass =
    "h-[52px] w-full rounded-[14px] bg-field px-4 text-body outline-none focus:ring-2 focus:ring-ring"

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-surface p-8 shadow-card">
      <h1 className="text-2xl font-semibold">{t(c.title)}</h1>
      <p className="mt-1 text-sm text-subtle">{t(c.subtitle)}</p>

      <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <label className="block text-sm font-medium">
          {t("login.email")}
          <input type="email" className={`${fieldClass} mt-1 font-normal`} />
        </label>
        <label className="block text-sm font-medium">
          {t("login.password")}
          <input type="password" className={`${fieldClass} mt-1 font-normal`} />
        </label>
        <button
          type="submit"
          className="h-[48px] w-full cursor-pointer rounded-[10px] bg-primary font-bold text-cream transition-opacity hover:opacity-90"
        >
          {t(c.submit)}
        </button>
      </form>

      <p className="mt-4 rounded-[10px] border border-success-border bg-success-bg px-3 py-2 text-xs text-primary">
        {t("login.comingSoon")}
      </p>

      <p className="mt-6 text-center text-sm text-subtle">
        {t(c.switchText)}{" "}
        <Link href={c.switchHref} className="font-semibold text-primary hover:underline">
          {t(c.switchLink)}
        </Link>
      </p>
    </div>
  )
}
