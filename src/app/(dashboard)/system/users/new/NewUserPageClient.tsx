'use client'

import { Suspense } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UserForm } from '../_components/UserForm'

function UserFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  )
}

export function NewUserPageClient({ customerId }: { customerId: string }) {
  const { t } = useLocale()

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('user.create_title')}</h1>
        <p className="text-muted-foreground">{t('user.create_description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('user.information_title')}</CardTitle>
          <CardDescription>{t('user.information_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<UserFormSkeleton />}>
            <UserForm customerId={customerId} mode="create" />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
