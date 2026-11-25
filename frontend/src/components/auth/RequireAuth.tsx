"use client"

import { usePathname, useRouter } from "next/navigation"
import { Fragment, useEffect, useRef, type ReactNode } from "react"
import { useAuth } from "@/auth/AuthProvider"

/**
 * Shows its content only to logged-in users. A visitor who is not logged in goes to the login
 * page and is brought back afterwards; a user who logs out while on the page goes home.
 * This is a convenience for the UI: the real protection is the backend's token check.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const wasSignedIn = useRef(false)

  // Forget it when the page is left (it stays alive in the background after navigating).
  useEffect(
    () => () => {
      wasSignedIn.current = false
    },
    [],
  )

  useEffect(() => {
    if (status === "signedIn") wasSignedIn.current = true
    if (status !== "signedOut") return
    router.replace(wasSignedIn.current ? "/" : `/login?next=${encodeURIComponent(pathname)}`)
  }, [status, pathname, router])

  if (status !== "signedIn") {
    return <div className="mx-auto h-[320px] max-w-md animate-pulse rounded-2xl bg-warm-gray" role="status" />
  }
  // The key resets the page's state if a different account logs in.
  return <Fragment key={user?.id}>{children}</Fragment>
}
