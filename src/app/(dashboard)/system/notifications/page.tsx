import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Thông báo hệ thống</h1>
        <p className="text-muted-foreground">
          Xem lại tất cả các cảnh báo và thông báo từ hệ thống
        </p>
      </div>

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
    </div>
  )
}
