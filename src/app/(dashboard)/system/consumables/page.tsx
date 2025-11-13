import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PackagePlus } from 'lucide-react'
import BulkAssignModal from './_components/BulkAssignModal'

export default function ConsumablesPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Vật tư tiêu hao</h1>
            <p className="text-white/90">Quản lý vật tư tiêu hao</p>
          </div>
          <BulkAssignModal
            trigger={
              <Button className="bg-white text-emerald-700 hover:bg-white/90">
                <PackagePlus className="mr-2 h-4 w-4" /> Gán vật tư cho khách hàng
              </Button>
            }
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách</CardTitle>
          <CardDescription>Tính năng danh sách sẽ được bổ sung sau</CardDescription>
        </CardHeader>
        <CardContent>{null}</CardContent>
      </Card>
    </div>
  )
}
