'use client'

import Link from 'next/link'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'

export default function ForbiddenPage() {
  const { t } = useLocale()
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <ShieldAlert className="text-destructive h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">{t('error.forbidden.title')}</CardTitle>
          <CardDescription>{t('error.forbidden.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/">{t('common.back_to_home')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
