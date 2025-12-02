import AnalyticsPageClient from './analytics/_components/AnalyticsPageClient'
import { Suspense } from 'react'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Phân tích lợi nhuận',
}

export default async function RevenuePage() {
  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Phân tích lợi nhuận"
        subtitle="Theo dõi và phân tích doanh thu, chi phí và lợi nhuận"
        icon={<TrendingUp className="h-6 w-6" />}
      />
      <Suspense>
        <AnalyticsPageClient />
      </Suspense>
    </SystemPageLayout>
  )
}
