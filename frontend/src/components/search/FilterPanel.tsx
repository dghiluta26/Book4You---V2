"use client"

import { useState, type FormEvent } from "react"
import { useLanguage } from "@/i18n/LanguageProvider"
import type { TranslationKey } from "@/i18n/dictionaries"
import { EMPTY_FILTERS, areDatesValid, type SearchFilters } from "@/lib/search-filters"
import { ACCOMMODATION_TYPES, type AccommodationType } from "@/types/accommodation"

type Props = {
  filters: SearchFilters
  onApply: (filters: SearchFilters) => void
}

const fieldClass =
  "h-11 w-full rounded-[12px] bg-field px-3 text-sm text-body outline-none focus:ring-2 focus:ring-ring"

/**
 * Filter form. It edits a local copy and sends it up with "Apply", so the results do not
 * reload on every keystroke. The parent remounts it (key) when the URL changes.
 */
export function FilterPanel({ filters, onApply }: Props) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState<SearchFilters>(filters)
  const [dateError, setDateError] = useState(false)

  const update = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  function toggleType(type: AccommodationType) {
    update(
      "types",
      draft.types.includes(type) ? draft.types.filter((item) => item !== type) : [...draft.types, type],
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!areDatesValid(draft.check_in, draft.check_out)) {
      setDateError(true)
      return
    }
    setDateError(false)
    onApply({ ...draft, page: 1 })
  }

  function handleReset() {
    setDateError(false)
    onApply({ ...EMPTY_FILTERS, sort: draft.sort })
  }

  const labelClass = "mb-1 block text-xs font-medium text-subtle"

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-surface p-5 shadow-card">
      <h2 className="text-lg font-semibold">{t("filters.title")}</h2>

      <label className="block">
        <span className={labelClass}>{t("filters.city")}</span>
        <input
          type="text"
          value={draft.city}
          onChange={(event) => update("city", event.target.value)}
          className={fieldClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelClass}>{t("search.checkIn")}</span>
          <input
            type="date"
            value={draft.check_in}
            onChange={(event) => update("check_in", event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t("search.checkOut")}</span>
          <input
            type="date"
            value={draft.check_out}
            min={draft.check_in || undefined}
            onChange={(event) => update("check_out", event.target.value)}
            className={fieldClass}
          />
        </label>
      </div>
      {dateError && (
        <p
          role="alert"
          className="rounded-[10px] border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger"
        >
          {t("search.dateError")}
        </p>
      )}

      <label className="block">
        <span className={labelClass}>{t("search.guests")}</span>
        <input
          type="number"
          min={1}
          max={20}
          placeholder="—"
          value={draft.guests}
          onChange={(event) => update("guests", event.target.value)}
          className={fieldClass}
        />
      </label>

      <fieldset>
        <legend className={labelClass}>{t("filters.price")}</legend>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min={0}
            aria-label={t("filters.min")}
            placeholder={t("filters.min")}
            value={draft.min_price}
            onChange={(event) => update("min_price", event.target.value)}
            className={fieldClass}
          />
          <input
            type="number"
            min={0}
            aria-label={t("filters.max")}
            placeholder={t("filters.max")}
            value={draft.max_price}
            onChange={(event) => update("max_price", event.target.value)}
            className={fieldClass}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>{t("filters.type")}</legend>
        <div className="flex flex-wrap gap-2">
          {ACCOMMODATION_TYPES.map((type) => {
            const selected = draft.types.includes(type)
            return (
              <label
                key={type}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors ${
                  selected ? "bg-primary text-cream" : "bg-muted-green text-primary hover:bg-primary/12"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleType(type)}
                  className="sr-only"
                />
                {t(`type.${type}` as TranslationKey)}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button
          type="submit"
          className="h-11 flex-1 cursor-pointer rounded-[10px] bg-primary font-bold text-cream transition-opacity hover:opacity-90"
        >
          {t("filters.apply")}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="h-11 cursor-pointer rounded-[10px] border border-primary px-4 font-medium text-primary transition-colors hover:bg-primary/8"
        >
          {t("filters.reset")}
        </button>
      </div>
    </form>
  )
}
