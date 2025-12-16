'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ServiceRequestsTable } from './_components/ServiceRequestsTable'
import { PurchaseRequestsTable } from './_components/PurchaseRequestsTable'
import { useQuery } from '@tanstack/react-query'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import { Loader2, FileText, Wrench, ShoppingCart } from 'lucide-react'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { ServiceRequestCreateModal } from '../service-requests/_components/ServiceRequestCreateModal'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { Separator } from '@/components/ui/separator'
import { useLocale } from '@/components/providers/LocaleProvider'

export const dynamic = 'force-dynamic'

export default function RequestsPage() {
  const { t } = useLocale()

  // Fetch quick counts
  const { data: serviceData, isLoading: loadingService } = useQuery({
    queryKey: ['service-requests', 'count'],
    queryFn: () => serviceRequestsClientService.getAll({ page: 1, limit: 1 }),
    staleTime: 60_000,
  })

  const { data: purchaseData, isLoading: loadingPurchase } = useQuery({
    queryKey: ['purchase-requests', 'count'],
    queryFn: () => purchaseRequestsClientService.getAll({ page: 1, limit: 1 }),
    staleTime: 60_000,
  })

  const serviceCount = (serviceData as { pagination?: { total?: number } })?.pagination?.total ?? 0
  const purchaseCount =
    (purchaseData as { pagination?: { total?: number } })?.pagination?.total ?? 0

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('page.requests.title')}
        subtitle={t('page.requests.subtitle')}
        icon={<FileText className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <ServiceRequestCreateModal />
          </div>
        }
      />

      <Separator className="my-4" />

      <Tabs defaultValue="service" className="space-y-6">
        {/* Tabs List với style hiện đại hơn */}
        <div>
          <TabsList className="bg-muted inline-flex h-10 items-center justify-start rounded-lg p-1">
            <ActionGuard pageId="customer-requests" actionId="view-service-requests">
              <TabsTrigger
                value="service"
                className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  {t('page.requests.tab.service')}
                </span>
                <Badge className="ml-1 h-5 rounded-full border border-[var(--error-200)] bg-[var(--error-50)] px-1.5 text-[10px] font-normal text-[var(--error-500)]">
                  {loadingService ? <Loader2 className="h-3 w-3 animate-spin" /> : serviceCount}
                </Badge>
              </TabsTrigger>
            </ActionGuard>

            <ActionGuard pageId="customer-requests" actionId="view-purchase-requests">
              <TabsTrigger
                value="purchase"
                className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  {t('page.requests.tab.purchase')}
                </span>
                <Badge className="ml-1 h-5 rounded-full border border-[var(--brand-200)] bg-[var(--brand-50)] px-1.5 text-[10px] font-normal text-[var(--brand-700)]">
                  {loadingPurchase ? <Loader2 className="h-3 w-3 animate-spin" /> : purchaseCount}
                </Badge>
              </TabsTrigger>
            </ActionGuard>
          </TabsList>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          <ActionGuard pageId="customer-requests" actionId="view-service-requests">
            <TabsContent
              value="service"
              className="animate-in fade-in-50 slide-in-from-bottom-2 mt-0 space-y-4 duration-300"
            >
              <ServiceRequestsTable />
            </TabsContent>
          </ActionGuard>

          <ActionGuard pageId="customer-requests" actionId="view-purchase-requests">
            <TabsContent
              value="purchase"
              className="animate-in fade-in-50 slide-in-from-bottom-2 mt-0 space-y-4 duration-300"
            >
              <PurchaseRequestsTable />
            </TabsContent>
          </ActionGuard>
        </div>
      </Tabs>
    </SystemPageLayout>
  )
}
