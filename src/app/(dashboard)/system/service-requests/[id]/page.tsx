import { ServiceRequestDetailClient } from './_components/ServiceRequestDetailClient'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'

interface Props {
  // Match Next's generated PageProps shape which uses a Promise for params
  params?: Promise<{ id: string }>
}

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

export default async function ServiceRequestPage({ params }: Props) {
  let session = await getSession()

  // Resolve params which may be either a Promise (build-time types) or a plain object
  const resolved = await params
  const id = resolved?.id ?? ''

  // DEV mode fallback
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return <ServiceRequestDetailClient id={id} session={session} />
}
