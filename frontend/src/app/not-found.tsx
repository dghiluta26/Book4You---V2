import { NotFoundView } from "@/components/layout/NotFoundView"
import { PageShell } from "@/components/layout/PageShell"

export default function NotFound() {
  return (
    <PageShell>
      <NotFoundView kind="page" />
    </PageShell>
  )
}
