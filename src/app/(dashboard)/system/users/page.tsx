import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { UsersTable } from './_components/UsersTable'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import UsersHeaderClient from './UsersHeaderClient'

export default async function UsersPage() {
  const session = await getSession()
  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  return (
    <SystemPageLayout fullWidth>
      <UsersHeaderClient />
      <UsersTable />
    </SystemPageLayout>
  )
}
