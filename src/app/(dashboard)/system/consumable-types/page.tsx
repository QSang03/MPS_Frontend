'use client'

import { ConsumableTypeList } from './_components/ConsumableTypeList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Package, Plus, Upload, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionGuard } from '@/components/shared/ActionGuard'
import ImportExcelModal from './_components/ImportExcelModal'
import BulkAssignModal from '../consumables/_components/BulkAssignModal'
import ConsumableTypeFormModal from './_components/ConsumableTypeFormModal'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function ConsumableTypesPage() {
  const { t } = useLocale()
  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('consumable_types.page.title')}
        subtitle={t('consumable_types.page.subtitle')}
        icon={<Package className="h-8 w-8" />}
        actions={
          <>
            <ImportExcelModal
              trigger={
                <Button className="border-0 bg-white text-[var(--brand-500)] hover:bg-[var(--brand-50)]">
                  <Upload className="mr-2 h-4 w-4" />
                  {t('consumable_types.import.button')}
                </Button>
              }
            />
            <BulkAssignModal
              trigger={
                <Button className="border-0 bg-white text-[var(--brand-500)] hover:bg-[var(--brand-50)]">
                  <Link2 className="mr-2 h-4 w-4" />
                  {t('consumable_types.actions.bulk_assign')}
                </Button>
              }
            />
            <ActionGuard pageId="consumable-types" actionId="create">
              <ConsumableTypeFormModal
                mode="create"
                onSaved={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }}
                trigger={
                  <Button className="border-0 bg-white text-[var(--brand-500)] hover:bg-[var(--brand-50)]">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('consumable_types.actions.create')}
                  </Button>
                }
              />
            </ActionGuard>
          </>
        }
      />
      <ConsumableTypeList />
    </SystemPageLayout>
  )
}
