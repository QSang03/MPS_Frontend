'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ServiceRequestsTable } from './_components/ServiceRequestsTable'
import { PurchaseRequestsTable } from './_components/PurchaseRequestsTable'
import { SlaQuickPanel } from './_components/SlaQuickPanel'
import { useQuery } from '@tanstack/react-query'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import { Loader2, FileText, Wrench, ShoppingCart, Clock } from 'lucide-react'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { ServiceRequestCreateModal } from '../service-requests/_components/ServiceRequestCreateModal'

export const dynamic = 'force-dynamic'

export default function RequestsPage() {
  // fetch quick counts for tabs (limit=1 so pagination.total is returned)
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
  const slaCount = 0 // SLA count not available via API yet

  return (
    <SystemPageLayout>
      <SystemPageHeader
        title="Quản trị yêu cầu khách hàng"
        subtitle="Theo dõi và xử lý nhanh các yêu cầu bảo trì & mua vật tư"
        icon={<FileText className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <ServiceRequestCreateModal />
          </div>
        }
      />

      <Tabs defaultValue="service" className="space-y-4">
        <TabsList>
          <TabsTrigger value="service" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span>Service Request</span>
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {loadingService ? <Loader2 className="h-3 w-3 animate-spin" /> : serviceCount}
            </span>
          </TabsTrigger>

          <TabsTrigger value="purchase" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Purchase Request</span>
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {loadingPurchase ? <Loader2 className="h-3 w-3 animate-spin" /> : purchaseCount}
            </span>
          </TabsTrigger>

          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>SLA</span>
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {slaCount}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="service" className="space-y-4">
          <ServiceRequestsTable />
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          <PurchaseRequestsTable />
        </TabsContent>

        <TabsContent value="sla" className="space-y-4">
          <SlaQuickPanel />
        </TabsContent>
      </Tabs>
    </SystemPageLayout>
  )
}
