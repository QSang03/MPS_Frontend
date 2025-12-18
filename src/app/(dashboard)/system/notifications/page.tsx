'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
// Client-side notifications list
import NotificationsListWrapper from './NotificationsListWrapper'

export default function NotificationsPage() {
  const { t } = useLocale()

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('notifications.page.title')}
        subtitle={t('notifications.page.subtitle')}
        icon={<Bell className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('notifications.card.title')}
          </CardTitle>
          <CardDescription>{t('notifications.card.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Client component handles fetching and interactions */}
          <div>
            <NotificationsListWrapper />
          </div>
        </CardContent>
      </Card>
    </SystemPageLayout>
  )
}
