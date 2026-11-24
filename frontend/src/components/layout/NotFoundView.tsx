"use client"

import Link from "next/link"
import { useLanguage } from "@/i18n/LanguageProvider"

/** Friendly "not found" box in the Book4You style. Used for unknown routes and unknown stays. */
export function NotFoundView({ kind }: { kind: "page" | "stay" }) {
  const { t } = useLanguage()
  const stay = kind === "stay"

  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-surface p-10 text-center shadow-card">
      <p className="text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold">
        {t(stay ? "details.notFoundTitle" : "notFound.title")}
      </h1>
      <p className="mt-2 text-subtle">{t(stay ? "details.notFoundText" : "notFound.text")}</p>
      <Link
        href={stay ? "/accommodations" : "/"}
        className="mt-8 inline-block rounded-[10px] bg-primary px-6 py-3 font-bold text-cream transition-opacity hover:opacity-90"
      >
        {t(stay ? "details.back" : "notFound.home")}
      </Link>
    </div>
  )
}
