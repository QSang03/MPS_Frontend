import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PurchaseRequestForm } from '../_components/PurchaseRequestForm'
import { useLocale } from '@/components/providers/LocaleProvider'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function LocalizedPageContent({ customerId }: { customerId: string }) {
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
            <PurchaseRequestForm customerId={customerId} mode="create" />
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

function PurchaseRequestPageContent({ customerId }: { customerId: string }) {
  return <LocalizedPageContent customerId={customerId} />
}

export default async function NewPurchaseRequestPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return <PurchaseRequestPageContent customerId={session!.customerId} />
}
