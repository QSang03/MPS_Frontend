import { Button } from '@/components/ui/button'
import { PackagePlus, Package } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import BulkAssignModal from './_components/BulkAssignModal'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import ConsumablesList from './_components/ConsumablesList'

export default function ConsumablesPage() {
  const { t } = useLocale()
  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('page.consumables.title')}
        subtitle={t('page.consumables.subtitle')}
        icon={<Package className="h-6 w-6" />}
        actions={
          <BulkAssignModal
            trigger={
              <Button className="border-0 bg-white text-[var(--brand-500)] hover:bg-[var(--brand-50)]">
                <PackagePlus className="mr-2 h-4 w-4" />{' '}
                {t('consumables.button.assign_to_customer')}
              </Button>
            }
          />
        }
      />
      <ConsumablesList />
    </SystemPageLayout>
  )
}
