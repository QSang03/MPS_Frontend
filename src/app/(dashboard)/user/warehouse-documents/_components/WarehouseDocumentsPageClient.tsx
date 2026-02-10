'use client'

import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
import WarehouseDocumentList from './WarehouseDocumentList'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function WarehouseDocumentsPageClient() {
  const { t } = useLocale()

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('page.warehouseDocuments.user_title')}</h1>
          <p className="text-muted-foreground">{t('page.warehouseDocuments.user_subtitle')}</p>
        </div>
        {/* Create action removed for user scope */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('warehouse_document.list_title')}</CardTitle>
          <CardDescription>{t('warehouse_document.list_description_user')}</CardDescription>
        </CardHeader>
        <CardContent>
          <WarehouseDocumentList />
        </CardContent>
      </Card>
    </div>
  )
}
