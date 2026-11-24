"use client"

import { useLanguage } from "@/i18n/LanguageProvider"
import { SearchBox } from "@/components/search/SearchBox"

// Placeholder photo (replace with your own file in /public later).
const HERO_PHOTO = "https://picsum.photos/seed/book4you-hero/1920/1080"

/** Hero: 90vh, dark overlay on a photo, centered cream text and the floating search box. */
export function Hero() {
  const { t } = useLanguage()

  return (
    <section
      className="flex min-h-[90vh] items-center justify-center bg-primary bg-cover bg-center px-4 py-16 text-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${HERO_PHOTO})`,
      }}
    >
      <div className="w-full">
        <h1 className="mx-auto max-w-3xl text-[32px] font-semibold text-cream md:text-5xl">
          {t("home.title")}
        </h1>
        <p className="mx-auto mt-4 mb-10 max-w-2xl text-lg text-cream/90">{t("home.subtitle")}</p>
        <SearchBox />
      </div>
    </section>
  )
}
