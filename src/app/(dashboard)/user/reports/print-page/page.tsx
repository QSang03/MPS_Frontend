import { FileSpreadsheet } from 'lucide-react'
import { getSession } from '@/lib/auth/session'
import { DEV_BYPASS_AUTH, getDevSession } from '@/lib/auth/dev-session'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { PrintPageReportList } from './_components/PrintPageReportList'

export const dynamic = 'force-dynamic'

export default async function PrintPageReportPage() {
  let session = await getSession()
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('user')
  }

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Print Page Report"
        subtitle="Generate and manage print page usage reports for billing periods"
        icon={<FileSpreadsheet className="h-6 w-6" />}
      />
      <PrintPageReportList />
    </SystemPageLayout>
  )
}
