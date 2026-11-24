import type { ReactNode } from "react"

/** Centered content column shared by the pages. `wide` is for pages with a map. */
export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div
      className={`mx-auto w-full px-4 py-12 md:px-[60px] ${wide ? "max-w-[1600px]" : "max-w-6xl"}`}
    >
      {children}
    </div>
  )
}
