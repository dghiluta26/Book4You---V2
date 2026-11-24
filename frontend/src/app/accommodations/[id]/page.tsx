import { Suspense } from "react"
import { AccommodationDetails } from "@/components/details/AccommodationDetails"
import { PageShell } from "@/components/layout/PageShell"

export default function AccommodationDetailsPage() {
  return (
    <PageShell wide>
      {/* The [id] parameter is only known at request time, so it lives inside Suspense */}
      <Suspense fallback={<div className="h-[480px] animate-pulse rounded-2xl bg-warm-gray" />}>
        <AccommodationDetails />
      </Suspense>
    </PageShell>
  )
}
