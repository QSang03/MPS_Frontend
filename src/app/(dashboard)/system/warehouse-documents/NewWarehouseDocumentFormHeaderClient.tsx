'use client'

import React from 'react'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function NewWarehouseDocumentFormHeaderClient() {
  const { t } = useLocale()

  return (
    <CardHeader>
      <CardTitle>{t('warehouse_document.form.title')}</CardTitle>
      <CardDescription>{t('warehouse_document.form.description')}</CardDescription>
    </CardHeader>
  )
}
