import type { ReactNode } from "react"

/** Centered content column shared by the simple pages. */
export function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-[60px]">{children}</div>
}
