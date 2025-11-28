'use client'

import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
import WarehouseDocumentList from './WarehouseDocumentList'

export default function WarehouseDocumentsPageClient() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chứng từ kho của tôi</h1>
          <p className="text-muted-foreground">
            Danh sách các chứng từ nhập/xuất/trả liên quan đến tôi
          </p>
        </div>
        {/* Create action removed for user scope */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách chứng từ</CardTitle>
          <CardDescription>Quản lý chứng từ xuất/nhập trả trong kho (scope user)</CardDescription>
        </CardHeader>
        <CardContent>
          <WarehouseDocumentList />
        </CardContent>
      </Card>
    </div>
  )
}
