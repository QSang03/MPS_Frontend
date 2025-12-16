'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { useActionPermission } from '@/lib/hooks/useActionPermission'

export default function CostsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'monthly' | 'usage'>('monthly')
  const { t } = useLocale()
  const { can } = useActionPermission('user-costs')
  const canViewMonthly = can('view-monthly-tab')
  const canViewUsage = can('view-usage-tab')

  useEffect(() => {
    const isUsage = Boolean(pathname?.includes('/usage'))
    const isMonthly = !isUsage

    // If user lands on a tab they can't access, redirect to the first available one.
    if (isUsage && !canViewUsage && canViewMonthly) {
      router.replace('/user/dashboard/costs/monthly')
      return
    }
    if (isMonthly && !canViewMonthly && canViewUsage) {
      router.replace('/user/dashboard/costs/usage')
      return
    }

    if (isUsage) {
      setTimeout(() => setActiveTab('usage'), 0)
    } else {
      setTimeout(() => setActiveTab('monthly'), 0)
    }
  }, [pathname, canViewMonthly, canViewUsage, router])

  const handleTabChange = (value: string) => {
    if (value === 'usage') {
      if (!canViewUsage) return
      router.push('/user/dashboard/costs/usage')
    } else {
      if (!canViewMonthly) return
      router.push('/user/dashboard/costs/monthly')
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-muted inline-flex h-10 items-center justify-start rounded-lg p-1">
            <ActionGuard pageId="user-costs" actionId="view-monthly-tab">
              <TabsTrigger
                value="monthly"
                className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap"
              >
                <DollarSign className="h-4 w-4" />
                {t('page.user.costs.tabs.monthly')}
              </TabsTrigger>
            </ActionGuard>
            <ActionGuard pageId="user-costs" actionId="view-usage-tab">
              <TabsTrigger
                value="usage"
                className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap"
              >
                <FileText className="h-4 w-4" />
                {t('page.user.costs.tabs.usage')}
              </TabsTrigger>
            </ActionGuard>
          </TabsList>
        </Tabs>
      </div>
      {children}
    </div>
  )
}
