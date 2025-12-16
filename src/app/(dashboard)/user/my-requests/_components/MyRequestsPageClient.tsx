'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, Plus, Wrench, ShoppingCart, Clock } from 'lucide-react'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import { getClientUserProfile } from '@/lib/auth/client-auth'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ServiceRequestFormModal } from './ServiceRequestFormModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserRequestsTable } from './UserRequestsTable'
import { UserPurchaseRequestsTable } from './UserPurchaseRequestsTable'
import { UserSlaPanel } from './UserSlaPanel'
import { useActionPermission } from '@/lib/hooks/useActionPermission'

export default function MyRequestsPageClient() {
  const queryClient = useQueryClient()
  const { t } = useLocale()
  const { can } = useActionPermission('user-my-requests')
  const [customerId, setCustomerId] = useState<string | null>(null)

  const canViewService = can('view-service-requests')
  const canViewPurchase = can('view-purchase-requests')
  const canViewSla = can('view-sla')
  const canCreateService = can('create-service-request')
  const canCreatePurchase = can('create-purchase-request')
  const canOpenCreate = canCreateService || canCreatePurchase

  const defaultTab = canViewService
    ? 'service'
    : canViewPurchase
      ? 'purchase'
      : canViewSla
        ? 'sla'
        : 'service'

  // Load customerId from user profile
  useEffect(() => {
    let mounted = true
    const loadCustomerId = async () => {
      try {
        const profile = await getClientUserProfile()
        if (!mounted) return
        if (profile?.user?.customerId) {
          setCustomerId(profile.user.customerId)
        } else {
          toast.error(t('error.cannot_load_customer'))
        }
      } catch (err) {
        if (!mounted) return
        console.error('Failed to load client profile', err)
        toast.error(t('error.cannot_load_user_profile'))
      }
    }
    loadCustomerId()
    return () => {
      mounted = false
    }
  }, [t])

  // Fetch counts for tabs
  const { data: serviceData, isLoading: loadingService } = useQuery({
    queryKey: ['service-requests', 'count', customerId],
    queryFn: () =>
      serviceRequestsClientService.getAll({
        page: 1,
        limit: 1,
        customerId: customerId || undefined,
      }),
    enabled: !!customerId && canViewService,
    staleTime: 60_000,
  })

  const { data: purchaseData, isLoading: loadingPurchase } = useQuery({
    queryKey: ['purchase-requests', 'count', customerId],
    queryFn: () =>
      purchaseRequestsClientService.getAll({
        page: 1,
        limit: 1,
        customerId: customerId || undefined,
      }),
    enabled: !!customerId && canViewPurchase,
    staleTime: 60_000,
  })

  const serviceCount = (serviceData as { pagination?: { total?: number } })?.pagination?.total ?? 0
  const purchaseCount =
    (purchaseData as { pagination?: { total?: number } })?.pagination?.total ?? 0
  const slaCount = 0 // SLA count not available via API yet or handled in component

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    toast.success(t('toast.refreshed'))
  }

  if (!customerId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-600)] dark:text-[var(--brand-400)]" />
      </div>
    )
  }

  if (!canViewService && !canViewPurchase && !canViewSla) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="max-w-md rounded-lg border bg-white p-6 text-center shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-semibold">{t('error.forbidden.title')}</h2>
          <p className="text-muted-foreground mt-2 text-sm">{t('error.forbidden.description')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-50/50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="w-full space-y-6">
        {/* Header */}
        <PageHeader
          title={t('page.my-requests.title')}
          subtitle={t('page.my-requests.subtitle')}
          icon={<FileText className="h-6 w-6" />}
          actions={
            canOpenCreate ? (
              <div className="flex items-center gap-3">
                <ServiceRequestFormModal
                  customerId={customerId}
                  onSuccess={handleRefresh}
                  permissionPageId="user-my-requests"
                >
                  <Button className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('user_service_request.create_new')}
                  </Button>
                </ServiceRequestFormModal>
              </div>
            ) : null
          }
          className="mb-6"
        />

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            {canViewService && (
              <TabsTrigger value="service" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <span>Service Request</span>
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {loadingService ? <Loader2 className="h-3 w-3 animate-spin" /> : serviceCount}
                </span>
              </TabsTrigger>
            )}

            {canViewPurchase && (
              <TabsTrigger value="purchase" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Purchase Request</span>
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {loadingPurchase ? <Loader2 className="h-3 w-3 animate-spin" /> : purchaseCount}
                </span>
              </TabsTrigger>
            )}

            {canViewSla && (
              <TabsTrigger value="sla" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>SLA</span>
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {slaCount}
                </span>
              </TabsTrigger>
            )}
          </TabsList>

          {canViewService && (
            <TabsContent value="service" className="space-y-4">
              <UserRequestsTable defaultCustomerId={customerId} />
            </TabsContent>
          )}

          {canViewPurchase && (
            <TabsContent value="purchase" className="space-y-4">
              <UserPurchaseRequestsTable defaultCustomerId={customerId} />
            </TabsContent>
          )}

          {canViewSla && (
            <TabsContent value="sla" className="space-y-4">
              <UserSlaPanel customerId={customerId} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
