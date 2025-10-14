import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { UsersTable } from './_components/UsersTable'
import { usersService } from '@/lib/api/services/users.service'

export default async function UsersPage() {
  // Check authentication
  const session = await getSession()
  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  try {
    // Get users data
    const usersData = await usersService.getUsers({ page: 1, limit: 10 })

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Quản lý tài khoản người dùng và phân quyền</p>
        </div>

        <UsersTable initialUsers={usersData.users} />
      </div>
    )
  } catch (error) {
    console.error('Error loading users:', error)

    // If authentication failed, redirect to login
    if (error instanceof Error && error.message.includes('Authentication failed')) {
      redirect(ROUTES.LOGIN)
    }

    // For other errors, show error page
    throw error
  }
}
