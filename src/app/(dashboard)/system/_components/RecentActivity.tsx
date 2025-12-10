'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { ArrowRight, Printer, FileText, AlertCircle, History } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/providers/LocaleProvider'

import type { AdminOverviewData } from '@/types/dashboard'

interface RecentActivityProps {
  onViewAll?: () => void
  recentRequests?: AdminOverviewData['recentRequests']
}

// We'll construct recent activity from incoming props if provided

const iconMap = {
  device: Printer,
  service: FileText,
  request: FileText,
  notification: AlertCircle,
}

export function RecentActivity({ onViewAll, recentRequests }: RecentActivityProps) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const { t, locale } = useLocale()

  useEffect(() => {
    // Avoid synchronous setState inside an effect by scheduling update asynchronously.
    // This prevents a cascading render on mount while preserving the "mounted" flag.
    const t = setTimeout(() => setIsClient(true), 0)
    return () => clearTimeout(t)
  }, [])

  // Build list from recentRequests only
  const activities: Array<{
    id: string
    type: 'request' | 'notification' | 'device' | 'service' | string
    title: string
    description?: string
    time?: string
    severity?: 'low' | 'normal' | 'high' | string
  }> = []

  if (recentRequests && recentRequests.length > 0) {
    recentRequests.forEach((r) =>
      activities.push({
        id: r.id,
        type: r.type || 'request',
        title: r.title,
        description: r.customer?.name ?? r.status,
        time: r.createdAt,
        severity: String(r.priority ?? '').toLowerCase() as 'low' | 'normal' | 'high',
      })
    )
  }

  // If nothing from API, keep fallback empty array (no mock content)
  // Sort by time desc
  activities.sort((a, b) => {
    const ta = a.time ? Date.parse(a.time) : 0
    const tb = b.time ? Date.parse(b.time) : 0
    return tb - ta
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t('dashboard.recent_activity.title')}
            </CardTitle>
            <CardDescription>{t('dashboard.recent_activity.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-gray-500">
              <p className="text-center">{t('dashboard.recent_activity.empty')}</p>
            </div>
          ) : (
            activities.slice(0, 6).map((activity) => {
              const Icon = iconMap[activity.type as keyof typeof iconMap] ?? FileText
              const routeForActivity = (() => {
                if (!activity.id) return '/system/requests'
                const t = (activity.type || '').toLowerCase()
                if (t.includes('service')) return `/system/service-requests/${activity.id}`
                if (t.includes('purchase')) return `/system/purchase-requests/${activity.id}`
                // default to list page if specific detail page is not available
                return `/system/requests`
              })()

              return (
                <button
                  key={activity.id}
                  onClick={() => {
                    if (!routeForActivity) return
                    try {
                      router.push(routeForActivity)
                    } catch (err) {
                      console.error('Navigation failed for request', activity.id, err)
                    }
                  }}
                  className="flex w-full items-start gap-4 border-b pb-4 text-left last:border-0 hover:bg-gray-50"
                >
                  <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-none font-medium">{activity.title}</p>
                      {/* If item's severity is high OR it is a request with OPEN status or similar, show badge */}
                      {activity.severity === 'high' && (
                        <Badge variant="destructive" className="shrink-0">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {t('dashboard.recent_activity.critical')}
                        </Badge>
                      )}
                      {activity.type === 'request' && activity.description && (
                        <Badge variant="secondary" className="shrink-0">
                          {activity.description}
                        </Badge>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-muted-foreground text-sm">{activity.description}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {isClient && activity.time
                        ? formatRelativeTime(activity.time ?? '')
                        : activity.time
                          ? new Date(activity.time).toLocaleDateString(
                              locale === 'vi' ? 'vi-VN' : 'en-US'
                            )
                          : ''}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t bg-gray-50/50 p-4">
        <Button size="sm" onClick={onViewAll} className="gap-2">
          {t('dashboard.recent_activity.view_all')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
