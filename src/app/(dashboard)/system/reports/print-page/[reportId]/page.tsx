import { FileSpreadsheet } from 'lucide-react'
import { getSession } from '@/lib/auth/session'
import { DEV_BYPASS_AUTH, getDevSession } from '@/lib/auth/dev-session'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { PrintPageReportDetail } from './_components/PrintPageReportDetail'

export const dynamic = 'force-dynamic'

export default async function PrintPageReportDetailPage() {
  let session = await getSession()
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('admin')
  }

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Print Page Report Detail"
        subtitle="View detailed print page usage report"
        icon={<FileSpreadsheet className="h-6 w-6" />}
      />
      <PrintPageReportDetail />
    </SystemPageLayout>
  )
}
