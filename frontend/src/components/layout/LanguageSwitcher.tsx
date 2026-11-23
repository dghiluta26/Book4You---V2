"use client"

import { useLanguage } from "@/i18n/LanguageProvider"
import { LOCALES } from "@/i18n/dictionaries"
import { cn } from "@/lib/utils"

/** RO | EN toggle. The active language is shown bold with an underline. */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div role="group" aria-label={t("nav.language")} className="flex items-center gap-1 text-sm">
      {LOCALES.map((code, index) => (
        <span key={code} className="flex items-center gap-1">
          {index > 0 && <span className="opacity-50">|</span>}
          <button
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={locale === code}
            className={cn(
              "cursor-pointer uppercase transition-opacity hover:opacity-70",
              locale === code ? "font-bold underline underline-offset-4" : "font-normal",
            )}
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  )
}
