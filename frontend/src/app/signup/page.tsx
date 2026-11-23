import { PageShell } from "@/components/layout/PageShell"
import { AuthForm } from "@/components/layout/AuthForm"

export default function SignupPage() {
  return (
    <PageShell>
      <AuthForm mode="signup" />
    </PageShell>
  )
}
