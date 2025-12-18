import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { NewServiceRequestClient } from './NewServiceRequestClient'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function NewServiceRequestPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return <NewServiceRequestClient session={session} />
}
