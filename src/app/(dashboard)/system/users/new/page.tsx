import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { NewUserPageClient } from './NewUserPageClient'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function NewUserPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return <NewUserPageClient customerId={session!.customerId} />
}
