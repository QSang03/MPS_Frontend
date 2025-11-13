import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import ContractDevicesPageClient from './_components/ContractDevicesPageClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Thiết bị trong hợp đồng',
}

export default async function ContractDevicesPage({
  params,
}: {
  params: Promise<{ contractId: string }>
}) {
  let session = await getSession()
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }
  const { contractId } = await params
  return (
    <Suspense>
      <ContractDevicesPageClient contractId={contractId} />
    </Suspense>
  )
}
