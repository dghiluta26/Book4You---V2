import { Suspense } from "react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { MyBookings } from "@/components/booking/MyBookings"
import { PageShell } from "@/components/layout/PageShell"

export default function BookingsPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="mx-auto h-[320px] max-w-4xl animate-pulse rounded-2xl bg-warm-gray" />}>
        <RequireAuth>
          <MyBookings />
        </RequireAuth>
      </Suspense>
    </PageShell>
  )
}
