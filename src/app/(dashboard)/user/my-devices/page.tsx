import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function MyDevicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Thiết bị của tôi</h1>
        <p className="text-muted-foreground">Xem các thiết bị được phân công cho bạn</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Device #{i}234
              </CardTitle>
              <CardDescription>Máy in HP LaserJet Pro MFP M428fdn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <span className="font-medium text-green-600">Hoạt động</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vị trí:</span>
                  <span>
                    Tầng {i}, Phòng {i}01
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đã in:</span>
                  <span>{i * 1234} trang</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
