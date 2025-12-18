import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportGenerator } from './_components/ReportGenerator'
import { ReportHistory } from './_components/ReportHistory'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { FileText } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function ReportsPageContent({ customerId }: { customerId: string }) {
  const { t } = useLocale()

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('reports.page.title')}
        subtitle={t('reports.page.subtitle')}
        icon={<FileText className="h-6 w-6" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.page.generator_title')}</CardTitle>
            <CardDescription>{t('reports.page.generator_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportGenerator customerId={customerId} />
          </CardContent>
        </Card>

        {/* Report History */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.page.history_title')}</CardTitle>
            <CardDescription>{t('reports.page.history_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportHistory customerId={customerId} />
          </CardContent>
        </Card>
      </div>
    </SystemPageLayout>
  )
}

export default async function ReportsPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return <ReportsPageContent customerId={session!.customerId} />
}
