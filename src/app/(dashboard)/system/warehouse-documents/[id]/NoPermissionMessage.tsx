'use client'

import { useLocale } from '@/components/providers/LocaleProvider'

export function NoPermissionMessage() {
  const { t } = useLocale()

  return (
    <div className="text-muted-foreground py-8 text-center">
      {t('warehouse_document.no_permission')}
    </div>
  )
}
