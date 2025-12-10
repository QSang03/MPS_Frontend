'use client'

import React from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function UserNewWarehouseDocumentHeaderClient() {
  const { t } = useLocale()

  return (
    <div>
      <h1 className="text-3xl font-bold">{t('page.warehouseDocuments.create_title')}</h1>
      <p className="text-muted-foreground">{t('page.warehouseDocuments.create_subtitle')}</p>
    </div>
  )
}
