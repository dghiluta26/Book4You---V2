import { Suspense } from "react"
import { ProfileView } from "@/components/auth/ProfileView"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/layout/PageShell"

export default function ProfilePage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="mx-auto h-[320px] max-w-md animate-pulse rounded-2xl bg-warm-gray" />}>
        <RequireAuth>
          <ProfileView />
        </RequireAuth>
      </Suspense>
    </PageShell>
  )
}
