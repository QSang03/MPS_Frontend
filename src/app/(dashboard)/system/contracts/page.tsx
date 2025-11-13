import { Suspense } from 'react'
import ContractsPageClient from './_components/ContractsPageClient'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Contracts - Customer Admin',
}

export default async function ContractsPage() {
  let session = await getSession()

  // DEV bypass
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <Suspense>
      {/* Pass session to client component for PermissionGuard */}
      <ContractsPageClient session={session} />
    </Suspense>
  )
}
