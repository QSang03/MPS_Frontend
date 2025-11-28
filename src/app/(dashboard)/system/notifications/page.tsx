import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
// Client-side notifications list
import dynamic from 'next/dynamic'

const NotificationsListClient = dynamic(
  () => import('./NotificationsListClient').then((mod) => mod.default),
  { ssr: false }
)

export default function NotificationsPage() {
  return (
    <SystemPageLayout>
      <SystemPageHeader
        title="Thông báo hệ thống"
        subtitle="Xem lại tất cả các cảnh báo và thông báo từ hệ thống"
        icon={<Bell className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Tất cả thông báo
          </CardTitle>
          <CardDescription>Danh sách đầy đủ các cảnh báo</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Client component handles fetching and interactions */}
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore - dynamic client import handled at runtime */}
          <div>
            {/* Lazy client component import to keep page server-renderable */}
            {/* The client component is in the same folder */}
            <NotificationsListClient />
          </div>
        </CardContent>
      </Card>
    </SystemPageLayout>
  )
}
