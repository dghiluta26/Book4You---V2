"use client"

import { useLanguage } from "@/i18n/LanguageProvider"
import { cn } from "@/lib/utils"

type Props = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

/** Previous / numbered pages / Next. Shows a window of up to 5 page numbers. */
export function Pagination({ page, totalPages, onChange }: Props) {
  const { t } = useLanguage()
  if (totalPages <= 1) return null

  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index)

  const buttonClass =
    "h-10 min-w-10 cursor-pointer rounded-[10px] border border-primary px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/8 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"

  return (
    <nav aria-label={t("pagination.page", { page, total: totalPages })} className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <button className={buttonClass} disabled={page <= 1} onClick={() => onChange(page - 1)}>
            {t("pagination.prev")}
          </button>
        </li>
        {pages.map((number) => (
          <li key={number}>
            <button
              className={cn(buttonClass, number === page && "bg-primary text-cream hover:bg-primary")}
              aria-current={number === page ? "page" : undefined}
              onClick={() => onChange(number)}
            >
              {number}
            </button>
          </li>
        ))}
        <li>
          <button className={buttonClass} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
            {t("pagination.next")}
          </button>
        </li>
      </ul>
      <p className="mt-3 text-center text-xs text-subtle">
        {t("pagination.page", { page, total: totalPages })}
      </p>
    </nav>
  )
}
