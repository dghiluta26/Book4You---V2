"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import {
  DEFAULT_LOCALE,
  LOCALES,
  dictionaries,
  type Locale,
  type TranslationKey,
} from "./dictionaries"

const STORAGE_KEY = "book4you.locale"
const CHANGE_EVENT = "book4you:locale-change"

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Translate a key. Use {name} placeholders and pass values: t("results.found", { n: 5 }). */
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

// The chosen language lives in localStorage, so it survives page reloads.
// useSyncExternalStore keeps React in sync with it (and avoids hydration errors).
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

function getSnapshot(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return LOCALES.includes(stored as Locale) ? (stored as Locale) : DEFAULT_LOCALE
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  // Keep <html lang="..."> correct for accessibility and SEO.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => {
        const text: string = dictionaries[locale][key]
        if (!params) return text
        return text.replace(/\{(\w+)\}/g, (match, name: string) =>
          name in params ? String(params[name]) : match,
        )
      },
    }),
    [locale, setLocale],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

/** Access the current language and the translate function t("some.key"). */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>")
  return ctx
}
