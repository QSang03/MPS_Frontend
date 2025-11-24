import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { UsersTable } from './_components/UsersTable'
import UsersHeaderActions from './UsersHeaderActions'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Users } from 'lucide-react'

export default async function UsersPage() {
  const session = await getSession()
  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  return (
    <SystemPageLayout>
      <SystemPageHeader
        title="Quản lý người dùng"
        subtitle="Quản lý tài khoản người dùng và phân quyền"
        icon={<Users className="h-6 w-6" />}
        actions={<UsersHeaderActions />}
      />
      <UsersTable />
    </SystemPageLayout>
  )
}
