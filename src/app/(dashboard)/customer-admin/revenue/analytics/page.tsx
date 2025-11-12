import AnalyticsPageClient from './_components/AnalyticsPageClient'
import { Suspense } from 'react'

export const metadata = {
  title: 'Phân tích lợi nhuận',
}

export default async function AnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsPageClient />
    </Suspense>
  )
}
