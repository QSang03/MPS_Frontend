import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportGenerator } from './_components/ReportGenerator'
import { ReportHistory } from './_components/ReportHistory'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo cáo</h1>
        <p className="text-muted-foreground">Tạo và tải xuống báo cáo dịch vụ in ấn</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Tạo báo cáo mới</CardTitle>
            <CardDescription>Tạo báo cáo tùy chỉnh để phân tích</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportGenerator customerId={session!.customerId} />
          </CardContent>
        </Card>

        {/* Report History */}
        <Card>
          <CardHeader>
            <CardTitle>Báo cáo gần đây</CardTitle>
            <CardDescription>Các báo cáo đã tạo trước đó</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportHistory customerId={session!.customerId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
