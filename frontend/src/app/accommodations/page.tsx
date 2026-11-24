"use client"

import { Suspense } from "react"
import { PageShell } from "@/components/layout/PageShell"
import { ResultsView } from "@/components/search/ResultsView"
import { useLanguage } from "@/i18n/LanguageProvider"

export default function AccommodationsPage() {
  const { t } = useLanguage()

  return (
    <PageShell wide>
      <h1 className="text-3xl font-semibold">{t("accommodations.title")}</h1>
      <p className="mt-2 mb-8 text-subtle">{t("accommodations.subtitle")}</p>
      {/* useSearchParams needs a Suspense boundary so the rest of the page can be prerendered */}
      <Suspense fallback={<div className="h-[400px] animate-pulse rounded-2xl bg-warm-gray" />}>
        <ResultsView />
      </Suspense>
    </PageShell>
  )
}
