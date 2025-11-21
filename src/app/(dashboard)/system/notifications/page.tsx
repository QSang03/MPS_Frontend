import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'

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
          <div className="flex h-40 items-center justify-center text-gray-500">
            <p>Chức năng đang được phát triển...</p>
          </div>
        </CardContent>
      </Card>
    </SystemPageLayout>
  )
}
