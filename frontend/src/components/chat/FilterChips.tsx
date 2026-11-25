"use client"

import { Pencil, Plus, X } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useLanguage } from "@/i18n/LanguageProvider"
import type { TranslationKey } from "@/i18n/dictionaries"
import { formatAmount, formatDate } from "@/lib/format"
import { areDatesValid } from "@/lib/search-filters"
import type { SearchCriteria } from "@/types/chat"

type Field = "destination" | "dates" | "guests" | "min_price" | "max_price"

type Props = {
  criteria: SearchCriteria
  /** True while the assistant still needs a destination: offers an "add destination" chip. */
  needsDestination: boolean
  onChange: (next: SearchCriteria) => void
}

const chipClass = "flex items-center rounded-full bg-muted-green text-sm text-primary"
const iconButton =
  "flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-primary/12"
const inputClass =
  "h-8 rounded-[10px] bg-surface px-2 text-sm text-body outline-none focus:ring-2 focus:ring-ring"

/** Small inline form that replaces a chip while it is being edited. */
function ChipEditor({
  field,
  criteria,
  onSave,
  onCancel,
}: {
  field: Field
  criteria: SearchCriteria
  onSave: (next: SearchCriteria) => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const isDates = field === "dates"
  const [first, setFirst] = useState(String((isDates ? criteria.check_in : criteria[field]) ?? ""))
  const [second, setSecond] = useState(criteria.check_out ?? "")

  const numeric = field === "guests" || field === "min_price" || field === "max_price"

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault() // the browser already checked the min/max/required attributes
    if (isDates) {
      if (!first || !second || !areDatesValid(first, second)) return
      onSave({ ...criteria, check_in: first, check_out: second })
    } else if (numeric) {
      onSave({ ...criteria, [field]: first === "" ? null : Number(first) })
    } else {
      onSave({ ...criteria, destination: first.trim() || null })
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => event.key === "Escape" && onCancel()}
      className={`${chipClass} flex-wrap gap-2 py-1 pr-1 pl-3`}
    >
      <span>{t(`chip.${field}` as TranslationKey)}</span>
      <input
        autoFocus
        required
        type={isDates ? "date" : numeric ? "number" : "text"}
        min={field === "guests" ? 1 : numeric ? 0 : undefined}
        max={field === "guests" ? 20 : numeric ? 100000 : undefined}
        maxLength={100}
        aria-label={t(isDates ? "search.checkIn" : (`chip.${field}` as TranslationKey))}
        value={first}
        onChange={(event) => setFirst(event.target.value)}
        className={`${inputClass} ${numeric ? "w-24" : ""}`}
      />
      {isDates && (
        <input
          required
          type="date"
          min={first || undefined}
          aria-label={t("search.checkOut")}
          value={second}
          onChange={(event) => setSecond(event.target.value)}
          className={inputClass}
        />
      )}
      <button type="submit" className="h-8 cursor-pointer rounded-full bg-primary px-3 font-medium text-cream">
        {t("chat.save")}
      </button>
      <button type="button" onClick={onCancel} aria-label={t("chat.cancel")} className={iconButton}>
        <X className="size-4" />
      </button>
    </form>
  )
}

/** The understood filters as chips. Each can be edited or removed; the search follows. */
export function FilterChips({ criteria, needsDestination, onChange }: Props) {
  const { t, locale } = useLanguage()
  const [editing, setEditing] = useState<Field | null>(null)

  const chips: { field: Field; text: string; cleared: Partial<SearchCriteria> }[] = []
  if (criteria.destination) {
    chips.push({ field: "destination", text: criteria.destination, cleared: { destination: null } })
  }
  if (criteria.check_in && criteria.check_out) {
    chips.push({
      field: "dates",
      text: `${formatDate(criteria.check_in, locale)} – ${formatDate(criteria.check_out, locale)}`,
      cleared: { check_in: null, check_out: null },
    })
  }
  if (criteria.guests !== null) {
    const noun = t(criteria.guests === 1 ? "card.guest" : "card.guests")
    chips.push({ field: "guests", text: `${criteria.guests} ${noun}`, cleared: { guests: null } })
  }
  if (criteria.min_price !== null) {
    chips.push({
      field: "min_price",
      text: t("chip.minValue", { n: formatAmount(criteria.min_price, locale) }),
      cleared: { min_price: null },
    })
  }
  if (criteria.max_price !== null) {
    chips.push({
      field: "max_price",
      text: t("chip.maxValue", { n: formatAmount(criteria.max_price, locale) }),
      cleared: { max_price: null },
    })
  }

  const isEmpty = chips.length === 0 && criteria.types.length === 0 && criteria.activities.length === 0
  if (isEmpty && !needsDestination) return null

  function save(next: SearchCriteria) {
    setEditing(null)
    onChange(next)
  }

  const removable = (key: string, text: string, onRemove: () => void) => (
    <li key={key} className={`${chipClass} pl-3`}>
      <span>{text}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("chat.remove", { name: text })}
        className={iconButton}
      >
        <X className="size-4" />
      </button>
    </li>
  )

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-subtle">{t("chat.filters")}</p>
      <ul className="flex flex-wrap items-center gap-2">
        {needsDestination && !criteria.destination && editing !== "destination" && (
          <li>
            <button
              type="button"
              onClick={() => setEditing("destination")}
              className="flex h-8 cursor-pointer items-center gap-1 rounded-full border border-dashed border-primary px-3 text-sm text-primary hover:bg-primary/8"
            >
              <Plus className="size-4" />
              {t("chip.destination")}
            </button>
          </li>
        )}
        {editing === "destination" && !criteria.destination && (
          <li>
            <ChipEditor field="destination" criteria={criteria} onSave={save} onCancel={() => setEditing(null)} />
          </li>
        )}

        {chips.map(({ field, text, cleared }) =>
          editing === field ? (
            <li key={field}>
              <ChipEditor field={field} criteria={criteria} onSave={save} onCancel={() => setEditing(null)} />
            </li>
          ) : (
            <li key={field} className={chipClass}>
              <button
                type="button"
                onClick={() => setEditing(field)}
                aria-label={t("chat.edit", { name: text })}
                className="flex h-8 cursor-pointer items-center gap-2 rounded-full pr-1 pl-3 hover:underline"
              >
                {text}
                <Pencil className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => save({ ...criteria, ...cleared })}
                aria-label={t("chat.remove", { name: text })}
                className={iconButton}
              >
                <X className="size-4" />
              </button>
            </li>
          ),
        )}

        {criteria.types.map((type) =>
          removable(`type-${type}`, t(`type.${type}` as TranslationKey), () =>
            save({ ...criteria, types: criteria.types.filter((item) => item !== type) }),
          ),
        )}
        {criteria.activities.map((activity) =>
          removable(`activity-${activity}`, activity, () =>
            save({ ...criteria, activities: criteria.activities.filter((item) => item !== activity) }),
          ),
        )}
      </ul>
      {criteria.activities.length > 0 && (
        <p className="mt-2 text-xs text-subtle">{t("chat.activitiesNote")}</p>
      )}
    </div>
  )
}
