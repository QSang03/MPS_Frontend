'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ServiceRequestForm } from '../_components/ServiceRequestForm'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { Session } from '@/lib/auth/session'

interface Props {
  session: Session | null
}

export function NewServiceRequestClient({ session }: Props) {
  const { t } = useLocale()

  if (!session) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{t('auth.required')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/system/service-requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('requests.service.new.title')}</h1>
          <p className="text-muted-foreground">{t('requests.service.new.subtitle')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('requests.service.new.card_title')}</CardTitle>
          <CardDescription>{t('requests.service.new.card_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceRequestForm customerId={session.customerId} />
        </CardContent>
      </Card>
    </div>
  )
}
