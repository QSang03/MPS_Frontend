'use client'

import React from 'react'
import Link from 'next/link'
import { Box, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function WarehouseDocumentsHeaderClient() {
  const { t } = useLocale()

  return (
    <SystemPageHeader
      title={t('page.warehouseDocuments.title')}
      subtitle={t('page.warehouseDocuments.subtitle')}
      icon={<Box className="h-5 w-5" />}
      actions={
        <div className="flex gap-2">
          <Link href="/system/warehouse-documents/new">
            <Button variant="default">
              <Plus className="mr-2 h-4 w-4" />
              {t('warehouse.create')}
            </Button>
          </Link>
        </div>
      }
    />
  )
}
