import { PurchaseRequestDetailClient } from './_components/PurchaseRequestDetailClient'
import { getSession } from '@/lib/auth/session'
import { DEV_BYPASS_AUTH, getDevSession } from '@/lib/auth/dev-session'

interface Props {
  params?: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function PurchaseRequestDetailPage({ params }: Props) {
  let session = await getSession()
  const resolved = await params
  const id = resolved?.id ?? ''

  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return <PurchaseRequestDetailClient id={id} session={session} />
}
