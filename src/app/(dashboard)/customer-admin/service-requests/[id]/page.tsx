import { ServiceRequestDetailClient } from './_components/ServiceRequestDetailClient'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'

interface Props {
  params: { id: string }
}

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

export default async function ServiceRequestPage({ params }: Props) {
  let session = await getSession()

  // DEV mode fallback
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return <ServiceRequestDetailClient id={params.id} session={session} />
}
