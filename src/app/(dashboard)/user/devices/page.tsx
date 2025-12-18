import DevicesPageClient from './_components/DevicesPageClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'

export const metadata = {
  title: 'My Devices',
}

export default function DevicesPage() {
  return (
    <UserPageLayout>
      <div className="p-4">
        <DevicesPageClient />
      </div>
    </UserPageLayout>
  )
}
