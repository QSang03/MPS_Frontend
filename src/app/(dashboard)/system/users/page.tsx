import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { UsersTable } from './_components/UsersTable'

export default async function UsersPage() {
  const session = await getSession()
  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
        <p className="text-muted-foreground">Quản lý tài khoản người dùng và phân quyền</p>
      </div>

      <UsersTable />
    </div>
  )
}
