import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { ProfileClient } from './_components/ProfileClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'

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
    <UserPageLayout>
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage account information and security</p>
        </div>

        <ProfileClient initialProfile={profile} />
      </div>
    </UserPageLayout>
  )
}
