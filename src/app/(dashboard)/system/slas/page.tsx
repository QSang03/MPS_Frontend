import { Suspense } from 'react'
import SlasClient from './_components/SlasClient'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'SLA Management',
}

export default async function SlasPage() {
  let session = await getSession()

  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <Suspense>
      <SlasClient session={session} />
    </Suspense>
  )
}
