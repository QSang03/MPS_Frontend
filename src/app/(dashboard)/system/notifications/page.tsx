'use client'

import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import NotificationsListWrapper from './NotificationsListWrapper'

export default function NotificationsPage() {
  return (
    <SystemPageLayout fullWidth className="space-y-0 p-0 sm:p-0 md:p-0 lg:p-0">
      <NotificationsListWrapper />
    </SystemPageLayout>
  )
}
