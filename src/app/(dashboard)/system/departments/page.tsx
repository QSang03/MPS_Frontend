import { DepartmentsTable } from './_components/DepartmentsTable'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Building2 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function DepartmentsPage() {
  const { t } = useLocale()

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('departments.page.title')}
        subtitle={t('departments.page.subtitle')}
        icon={<Building2 className="h-6 w-6" />}
      />
      <DepartmentsTable />
    </SystemPageLayout>
  )
}
