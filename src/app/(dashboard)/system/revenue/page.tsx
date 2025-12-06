'use client'

import { Suspense, useState, useMemo, startTransition } from 'react'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { TrendingUp, FileText, DollarSign } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import AnalyticsPageClient from './analytics/_components/AnalyticsPageClient'
import UsagePageClient from './usage/_components/UsagePageClient'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function RevenuePage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useLocale()

  // Calculate initial tab from URL params
  const initialTab = useMemo(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'usage') {
      return 'usage'
    } else if (pathname === '/system/revenue/usage') {
      return 'usage'
    }
    return 'analytics'
  }, [pathname, searchParams])

  const [activeTab, setActiveTab] = useState<'analytics' | 'usage'>(initialTab)

  // Update tab when URL changes, using startTransition to avoid cascading renders
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    const newTab =
      tabParam === 'usage' || pathname === '/system/revenue/usage' ? 'usage' : 'analytics'
    if (newTab !== activeTab) {
      startTransition(() => {
        setActiveTab(newTab)
      })
    }
  }, [pathname, searchParams, activeTab])

  const handleTabChange = (value: string) => {
    // Update tab state directly without navigation
    setActiveTab(value as 'analytics' | 'usage')
    // Update URL with query param for bookmarking
    const newUrl = value === 'usage' ? '/system/revenue?tab=usage' : '/system/revenue'
    window.history.replaceState(null, '', newUrl)
  }

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('revenue.title')}
        subtitle={t('revenue.subtitle')}
        icon={<TrendingUp className="h-6 w-6" />}
      />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="mb-6">
          <TabsList className="bg-muted inline-flex h-10 items-center justify-start rounded-lg p-1">
            <TabsTrigger
              value="analytics"
              className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap"
            >
              <DollarSign className="h-4 w-4" />
              {t('revenue.tab.analytics')}
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap"
            >
              <FileText className="h-4 w-4" />
              {t('revenue.tab.usage')}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="analytics" className="mt-0">
          <Suspense>
            <AnalyticsPageClient />
          </Suspense>
        </TabsContent>
        <TabsContent value="usage" className="mt-0">
          <Suspense>
            <UsagePageClient />
          </Suspense>
        </TabsContent>
      </Tabs>
    </SystemPageLayout>
  )
}
