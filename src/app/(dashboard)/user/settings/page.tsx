import { getSession } from '@/lib/auth/session'
import { getUserProfileForClient } from '@/lib/auth/server-actions'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { SettingsClient } from './_components/SettingsClient'

export default async function SettingsPage() {
  // Check authentication
  const session = await getSession()
  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  // Get user profile
  const profile = await getUserProfileForClient()

  // Note: Next.js server component cannot read client search params directly.
  // We pass the default tab via a query param handled on the client. SettingsClient
  // accepts an initialTab prop, but to keep server-side rendering simple we render the
  // client component and let it read the search params if present. For now pass profile only.
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">Quản lý cài đặt tài khoản và thông báo</p>
      </div>

      <SettingsClient initialProfile={profile} />
    </div>
  )
}
