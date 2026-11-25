"use client"

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/auth/AuthProvider"
import { useLanguage } from "@/i18n/LanguageProvider"

const itemClass =
  "block w-full cursor-pointer px-4 py-2 text-left text-sm text-body transition-colors hover:bg-primary/8"

/** "Hello, {name} ▾" dropdown shown in the navbar when logged in. */
export function UserMenu() {
  const { t } = useLanguage()
  const { name, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Public pages stay as they are; protected pages send the user home (see RequireAuth).
  async function handleLogout() {
    setOpen(false)
    await signOut()
  }

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex cursor-pointer items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
      >
        <span className="max-w-[200px] truncate">{t("nav.hello", { name })}</span>
        <ChevronDown className="size-4" />
      </button>

      {open && (
        // z-[1100]: above Leaflet's map controls
        <div className="absolute right-0 z-[1100] mt-2 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-card">
          <Link href="/profile" onClick={() => setOpen(false)} className={itemClass}>
            {t("nav.profile")}
          </Link>
          <button type="button" onClick={handleLogout} className={itemClass}>
            {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  )
}
