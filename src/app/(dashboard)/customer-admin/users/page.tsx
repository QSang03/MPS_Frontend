import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { UsersTable } from './_components/UsersTable'
import { usersService } from '@/lib/api/services/users.service'
import { rolesService } from '@/lib/api/services/roles.service'
import { departmentsService } from '@/lib/api/services/departments.service'
import { customerService } from '@/lib/api/services/customer.service'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Check authentication
  const session = await getSession()
  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  try {
    // Build query from URL (await per Next.js 15)
    const sp = await searchParams
    const page = Number(sp.page ?? 1)
    const limit = Number(sp.limit ?? 10)
    const search = typeof sp.search === 'string' ? sp.search : undefined
    const roleId = typeof sp.roleId === 'string' ? sp.roleId : undefined
    const departmentId = typeof sp.departmentId === 'string' ? sp.departmentId : undefined
    const customerId = typeof sp.customerId === 'string' ? sp.customerId : undefined

    // Get users, roles, departments, customers data
    const [usersData, roles, departments, customers] = await Promise.all([
      usersService.getUsers({ page, limit, search, roleId, departmentId, customerId }),
      rolesService.getRoles(),
      departmentsService.getDepartments(),
      customerService.getAll(),
    ])

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Quản lý tài khoản người dùng và phân quyền</p>
        </div>

        <UsersTable
          initialUsers={usersData.users}
          roles={roles.map((r) => ({ id: r.id, name: r.name }))}
          departments={departments.map((d) => ({ id: d.id, name: d.name }))}
          customers={customers}
        />
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
