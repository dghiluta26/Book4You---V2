"use client"

import Link from "next/link"
import { useLanguage } from "@/i18n/LanguageProvider"
import { useAuth } from "@/auth/AuthProvider"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { UserMenu } from "./UserMenu"

export function Navbar() {
  const { t } = useLanguage()
  const { status } = useAuth()

  return (
    <header className="bg-primary text-cream">
      <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-[15px] md:px-[60px]">
        <Link href="/" className="text-[26px] font-semibold tracking-[1px] text-cream">
          Book4You
        </Link>

        <ul className="flex items-center gap-6">
          <li>
            <Link href="/" className="transition-opacity hover:opacity-70">
              {t("nav.home")}
            </Link>
          </li>
          <li>
            <Link href="/accommodations" className="transition-opacity hover:opacity-70">
              {t("nav.accommodations")}
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {status === "signedIn" && <UserMenu />}
          {/* While the session is loading, keep the space empty to avoid a flash of buttons */}
          {status === "loading" && <span className="inline-block h-9 w-[200px]" aria-hidden />}
          {status === "signedOut" && (
            <>
              <Link
                href="/login"
                className="rounded-[5px] border border-cream px-4 py-2 text-sm transition-opacity hover:opacity-70"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/signup"
                className="rounded-[5px] bg-cream px-4 py-2 text-sm font-bold text-primary transition-opacity hover:opacity-90"
              >
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
