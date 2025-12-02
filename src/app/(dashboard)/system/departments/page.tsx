import { DepartmentsTable } from './_components/DepartmentsTable'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Building2 } from 'lucide-react'

export default function DepartmentsPage() {
  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Quản lý bộ phận"
        subtitle="Quản lý các bộ phận và phòng ban trong hệ thống"
        icon={<Building2 className="h-6 w-6" />}
      />
      <DepartmentsTable />
    </SystemPageLayout>
  )
}
