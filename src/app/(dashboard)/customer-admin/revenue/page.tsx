import RevenuePageClient from './_components/RevenuePageClient'
import { Suspense } from 'react'

export const metadata = {
  title: 'Báo cáo doanh thu',
}

export default async function RevenuePage() {
  return (
    <Suspense>
      <RevenuePageClient />
    </Suspense>
  )
}
