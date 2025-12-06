'use client'

import { CurrenciesList } from './_components/CurrenciesList'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Coins } from 'lucide-react'

export default function CurrenciesPage() {
  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Quản lý Tiền tệ"
        subtitle="Xem danh sách các loại tiền tệ trong hệ thống"
        icon={<Coins className="h-6 w-6" />}
      />
      <CurrenciesList />
    </SystemPageLayout>
  )
}
