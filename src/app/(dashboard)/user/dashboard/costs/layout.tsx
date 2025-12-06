'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function CostsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'monthly' | 'usage'>('monthly')

  useEffect(() => {
    if (pathname?.includes('/usage')) {
      setTimeout(() => setActiveTab('usage'), 0)
    } else {
      setTimeout(() => setActiveTab('monthly'), 0)
    }
  }, [pathname])

  const handleTabChange = (value: string) => {
    if (value === 'usage') {
      router.push('/user/dashboard/costs/usage')
    } else {
      router.push('/user/dashboard/costs/monthly')
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-muted inline-flex h-10 items-center justify-start rounded-lg p-1">
            <TabsTrigger
              value="monthly"
              className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap"
            >
              <DollarSign className="h-4 w-4" />
              Chi phí
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap"
            >
              <FileText className="h-4 w-4" />
              Thống kê sử dụng
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {children}
    </div>
  )
}
