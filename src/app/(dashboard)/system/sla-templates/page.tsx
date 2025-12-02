import { Suspense } from 'react'
import SlaTemplatesClient from './_components/SlaTemplatesClient'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'SLA Templates',
}

export default async function SlaTemplatesPage() {
  let session = await getSession()

  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <SystemPageLayout fullWidth>
      <Suspense>
        <SlaTemplatesClient session={session} />
      </Suspense>
    </SystemPageLayout>
  )
}
