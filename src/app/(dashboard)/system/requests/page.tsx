'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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
import { Separator } from '@/components/ui/separator'

export const dynamic = 'force-dynamic'

export default function RequestsPage() {
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
  const slaCount = 0 // Mock SLA

  return (
    <SystemPageLayout fullWidth>
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

      <Separator className="my-4" />

      <Tabs defaultValue="service" className="space-y-6">
        {/* Tabs List với style hiện đại hơn */}
        <div className="border-b">
          <TabsList className="h-auto w-full justify-start gap-6 bg-transparent p-0">
            <TabsTrigger
              value="service"
              className="group relative gap-2 rounded-none border-b-2 border-transparent pt-2 pb-4 font-medium transition hover:text-red-700 data-[state=active]:border-red-500 data-[state=active]:text-red-600"
            >
              <span className="flex items-center gap-2">
                <Wrench
                  className={`text-muted-foreground h-4 w-4 transition group-data-[state=active]:text-red-500`}
                />
                Service Request
              </span>
              <Badge className="ml-1 h-5 rounded-full border border-red-200 bg-red-100 px-1.5 text-[10px] font-normal text-red-700">
                {loadingService ? <Loader2 className="h-3 w-3 animate-spin" /> : serviceCount}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="purchase"
              className="group relative gap-2 rounded-none border-b-2 border-transparent pt-2 pb-4 font-medium transition hover:text-blue-700 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart
                  className={`text-muted-foreground h-4 w-4 transition group-data-[state=active]:text-blue-500`}
                />
                Purchase Request
              </span>
              <Badge className="ml-1 h-5 rounded-full border border-blue-200 bg-blue-100 px-1.5 text-[10px] font-normal text-blue-700">
                {loadingPurchase ? <Loader2 className="h-3 w-3 animate-spin" /> : purchaseCount}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="sla"
              className="group relative gap-2 rounded-none border-b-2 border-transparent pt-2 pb-4 font-medium transition hover:text-amber-700 data-[state=active]:border-amber-500 data-[state=active]:text-amber-600"
            >
              <span className="flex items-center gap-2">
                <Clock
                  className={`text-muted-foreground h-4 w-4 transition group-data-[state=active]:text-amber-500`}
                />
                SLA
              </span>
              <Badge className="ml-1 h-5 rounded-full border border-amber-200 bg-amber-100 px-1.5 text-[10px] font-normal text-amber-700">
                {slaCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          <TabsContent
            value="service"
            className="animate-in fade-in-50 slide-in-from-bottom-2 mt-0 space-y-4 duration-300"
          >
            <ServiceRequestsTable />
          </TabsContent>

          <TabsContent
            value="purchase"
            className="animate-in fade-in-50 slide-in-from-bottom-2 mt-0 space-y-4 duration-300"
          >
            <PurchaseRequestsTable />
          </TabsContent>

          <TabsContent
            value="sla"
            className="animate-in fade-in-50 slide-in-from-bottom-2 mt-0 space-y-4 duration-300"
          >
            <SlaQuickPanel />
          </TabsContent>
        </div>
      </Tabs>
    </SystemPageLayout>
  )
}
