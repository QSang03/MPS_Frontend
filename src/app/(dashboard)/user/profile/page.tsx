import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { ProfileClient } from './_components/ProfileClient'

export default async function ProfilePage() {
  // Check authentication
  const session = await getSession()
  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  // Note: Do not attempt to refresh tokens during server render (cookies cannot be modified here).
  // Fetching the profile is done on the client via a Server Action which can refresh tokens and update cookies.
  const profile = null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">Quản lý thông tin tài khoản và cài đặt cá nhân</p>
      </div>

      <ProfileClient initialProfile={profile} />
    </div>
  )
}
