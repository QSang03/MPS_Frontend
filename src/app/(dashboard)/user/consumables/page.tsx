import ConsumablesPageClient from './_components/ConsumablesPageClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'

export const metadata = {
  title: 'Vật tư tiêu hao của tôi',
}

export default function ConsumablesPage() {
  return (
    <UserPageLayout>
      <div className="p-4">
        <ConsumablesPageClient />
      </div>
    </UserPageLayout>
  )
}
