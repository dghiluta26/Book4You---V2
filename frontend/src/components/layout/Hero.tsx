"use client"

import Link from "next/link"
import { useLanguage } from "@/i18n/LanguageProvider"

/**
 * Hero: 90vh, dark overlay, centered cream text.
 * The background photo and the floating search box are added in Step 6.
 */
export function Hero() {
  const { t } = useLanguage()

  return (
    <section
      className="flex min-h-[90vh] items-center justify-center bg-primary bg-cover bg-center px-4 text-center"
      style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4))" }}
    >
      <div className="max-w-3xl">
        <h1 className="text-[32px] font-semibold text-cream md:text-5xl">{t("home.title")}</h1>
        <p className="mt-4 text-lg text-cream/90">{t("home.subtitle")}</p>
        <Link
          href="/accommodations"
          className="mt-8 inline-block rounded-[10px] bg-cream px-6 py-3 font-bold text-primary transition-opacity hover:opacity-90"
        >
          {t("home.cta")}
        </Link>
      </div>
    </section>
  )
}
