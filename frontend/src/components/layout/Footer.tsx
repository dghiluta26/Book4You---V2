"use client"

import Link from "next/link"
import { useAuth } from "@/auth/AuthProvider"
import { useLanguage } from "@/i18n/LanguageProvider"

export function Footer() {
  const { t } = useLanguage()
  const { status } = useAuth()
  const linkClass = "transition-opacity hover:opacity-70"
  const accountLinks =
    status === "signedIn"
      ? ([["/profile", "nav.profile"], ["/bookings", "nav.bookings"]] as const)
      : ([["/login", "nav.login"], ["/signup", "nav.signup"]] as const)

  return (
    <footer className="mt-auto bg-primary text-cream">
      <div className="grid gap-8 px-4 py-12 sm:grid-cols-2 md:px-[60px] lg:grid-cols-4">
        <div>
          <p className="text-[22px] font-semibold tracking-[1px]">Book4You</p>
          <p className="mt-2 text-sm opacity-80">{t("footer.tagline")}</p>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-cream">{t("footer.explore")}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className={linkClass}>{t("nav.home")}</Link>
            </li>
            <li>
              <Link href="/accommodations" className={linkClass}>{t("nav.accommodations")}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-cream">{t("footer.account")}</h3>
          <ul className="space-y-2 text-sm">
            {accountLinks.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className={linkClass}>{t(label)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-cream">{t("footer.about")}</h3>
          <p className="text-sm opacity-80">{t("footer.aboutText")}</p>
        </div>
      </div>

      <div className="border-t border-cream/20 px-4 py-4 text-center text-xs opacity-80 md:px-[60px]">
        © 2026 Book4You. {t("footer.rights")}
      </div>
    </footer>
  )
}
