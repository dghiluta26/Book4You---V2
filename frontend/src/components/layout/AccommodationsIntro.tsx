"use client"

import { useLanguage } from "@/i18n/LanguageProvider"

/** Temporary content for the empty Accommodations page (replaced in Step 6). */
export function AccommodationsIntro() {
  const { t } = useLanguage()

  return (
    <>
      <h1 className="text-3xl font-semibold">{t("accommodations.title")}</h1>
      <p className="mt-2 text-subtle">{t("accommodations.subtitle")}</p>
      <div className="mt-8 rounded-2xl bg-warm-gray p-10 text-center text-subtle">
        {t("accommodations.empty")}
      </div>
    </>
  )
}
