import { Suspense } from "react"
import { AuthForm } from "@/components/auth/AuthForm"
import { PageShell } from "@/components/layout/PageShell"

export default function SignupPage() {
  return (
    <PageShell>
      {/* useSearchParams (?next=...) needs a Suspense boundary */}
      <Suspense fallback={<div className="mx-auto h-[420px] max-w-md animate-pulse rounded-2xl bg-warm-gray" />}>
        <AuthForm mode="signup" />
      </Suspense>
    </PageShell>
  )
}
