import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { SettingsClient } from './_components/SettingsClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'
import Translated from '@/components/Translated'

export default async function SettingsPage() {
  // Check authentication
  const session = await getSession()
  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  // Note: do not fetch profile here during server render because refresh may update cookies.
  // Client component will call the server action to load profile (so cookie updates run inside a Server Action).
  const profile = null

  // Note: Next.js server component cannot read client search params directly.
  // We pass the default tab via a query param handled on the client. SettingsClient
  // accepts an initialTab prop, but to keep server-side rendering simple we render the
  // client component and let it read the search params if present. For now pass profile only.
  return (
    <UserPageLayout>
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <Translated k="page.user_settings.title" />
          </h1>
          <p className="text-muted-foreground">
            <Translated k="page.user_settings.subtitle" />
          </p>
        </div>

        <SettingsClient initialProfile={profile} />
      </div>
    </UserPageLayout>
  )
}
