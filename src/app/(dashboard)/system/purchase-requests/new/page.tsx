import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import serverApiClient from '@/lib/api/server-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { CurrencyDataDto } from '@/types/models/currency'
import type { Customer } from '@/types/models/customer'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PurchaseRequestForm } from '../_components/PurchaseRequestForm'
import { useLocale } from '@/components/providers/LocaleProvider'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function LocalizedPageContent({
  customerId,
  initialCurrencies,
  initialCustomer,
}: {
  customerId: string
  initialCurrencies?: CurrencyDataDto[]
  initialCustomer?: Customer | null
}) {
  'use client'
  const { t } = useLocale()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('purchase_request.new.title')}</h1>
        <p className="text-muted-foreground">{t('purchase_request.new.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('purchase_request.new.card_title')}</CardTitle>
          <CardDescription>{t('purchase_request.new.card_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PurchaseRequestFormSkeleton />}>
            <PurchaseRequestForm
              customerId={customerId}
              mode="create"
              initialCurrencies={initialCurrencies}
              initialCustomer={initialCustomer}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function PurchaseRequestFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

function PurchaseRequestPageContent({
  customerId,
  initialCurrencies,
  initialCustomer,
}: {
  customerId: string
  initialCurrencies?: CurrencyDataDto[]
  initialCustomer?: Customer | null
}) {
  return (
    <LocalizedPageContent
      customerId={customerId}
      initialCurrencies={initialCurrencies}
      initialCustomer={initialCustomer}
    />
  )
}

export default async function NewPurchaseRequestPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  // Server-seed currencies and customer to avoid initial client XHR in the form
  let initialCurrencies: CurrencyDataDto[] | undefined = undefined
  let initialCustomer: Customer | null | undefined = undefined

  try {
    const resp = await serverApiClient.get(`${API_ENDPOINTS.CURRENCIES.LIST}`, {
      params: { isActive: true, limit: 100 },
    })
    initialCurrencies = resp.data?.data ?? []
  } catch (err) {
    console.error('Failed to fetch currencies on server:', err)
  }

  try {
    const resp = await serverApiClient.get(`${API_ENDPOINTS.CUSTOMERS}/${session!.customerId}`)
    initialCustomer = resp.data?.data ?? null
  } catch (err) {
    console.error('Failed to fetch customer on server:', err)
  }

  return (
    <PurchaseRequestPageContent
      customerId={session!.customerId}
      initialCurrencies={initialCurrencies}
      initialCustomer={initialCustomer}
    />
  )
}
