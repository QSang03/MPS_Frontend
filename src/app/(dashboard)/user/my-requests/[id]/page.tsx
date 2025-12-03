import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import MyRequestDetailClient from './_components/MyRequestDetailClient'

interface Props {
  params?: Promise<{ id: string }>
}

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

export default async function MyRequestDetailPage({ params }: Props) {
  let session = await getSession()

  // Resolve params which may be either a Promise (build-time types) or a plain object
  const resolved = await params
  const id = resolved?.id ?? ''

  // DEV mode fallback
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('client')
  }

  return <MyRequestDetailClient id={id} session={session ?? null} />
}
