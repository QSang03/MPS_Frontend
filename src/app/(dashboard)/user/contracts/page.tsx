import ContractsPageClient from './_components/ContractsPageClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'

export const metadata = {
  title: 'My Contracts',
}

export default function ContractsPage() {
  return (
    <UserPageLayout>
      <div className="p-4">
        <ContractsPageClient />
      </div>
    </UserPageLayout>
  )
}
