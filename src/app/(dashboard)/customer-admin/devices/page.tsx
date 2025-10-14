import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { Skeleton } from '@/components/ui/skeleton'
import { DevicesPageClient } from './_components/DevicesPageClient'

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

function DeviceListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

export default async function DevicesPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <DevicesPageClient
      session={session!}
      customerId={session!.customerId}
      fallback={<DeviceListSkeleton />}
    />
  )
}
