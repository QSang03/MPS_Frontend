import AnalyticsPageClient from './analytics/_components/AnalyticsPageClient'
import { Suspense } from 'react'

export const metadata = {
  title: 'Phân tích lợi nhuận',
}

export default async function RevenuePage() {
  return (
    <Suspense>
      <AnalyticsPageClient />
    </Suspense>
  )
}
