import Link from 'next/link'
import serverApiClient from '@/lib/api/server-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { withRefreshRetry } from '@/lib/api/server-retry'
import { authServerService } from '@/lib/api/services/auth-server.service'
import ServiceRequestMessagesServer from '@/components/service-request/ServiceRequestMessagesServer'
import type { ServiceRequest, ServiceRequestCost } from '@/types/models'
import { ServiceRequestStatus } from '@/constants/status'
import { formatDateTime } from '@/lib/utils/formatters'
import getPublicUrl from '@/lib/utils/publicUrl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableHeader,
} from '@/components/ui/table'
// Dialog/Input imports removed (not used in user page)
import {
  ArrowLeft,
  Smartphone,
  Building2,
  FileText,
  Image as ImageIcon,
  Clock,
  Plus,
  CheckCircle2,
  Wrench,
  Package,
  XCircle,
} from 'lucide-react'
import Image from 'next/image'
// Server-safe translation stub (returns key). Avoid React hooks in server component.
const t = (key: string, ..._args: unknown[]) => {
  void _args
  return key
}
import { ActionGuard } from '@/components/shared/ActionGuard'
import { ServiceRequestRatingDisplay } from '@/components/service-request/ServiceRequestRatingDisplay'
import { ServiceRequestRatingModal } from '@/components/service-request/ServiceRequestRatingModal'
import ServiceRequestManagementClient from '@/components/service-request/ServiceRequestManagementClient'
// StatusBadge removed (not used)

type TimelineEvent = {
  label: string
  time: string
  by?: string
  reason?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

type TimelineEntry = TimelineEvent & { time: string }

export default async function UserServiceRequestDetail(props: {
  params?: Promise<Record<string, string | string[] | undefined>>
  searchParams?: Promise<unknown>
}) {
  // use server-safe t()
  const paramsObj = (await (props?.params ?? Promise.resolve({}))) as { id?: string }
  const requestId = paramsObj.id ?? ''

  // Server-side fetch: request detail, costs, and current user profile
  let request: ServiceRequest | null = null
  let costs: ServiceRequestCost[] = []
  let currentUser: { user?: { id?: string } } | null = null

  try {
    const [reqResp, costsResp, profile] = await Promise.all([
      withRefreshRetry(() => serverApiClient.get(API_ENDPOINTS.SERVICE_REQUESTS.DETAIL(requestId))),
      withRefreshRetry(() => serverApiClient.get(API_ENDPOINTS.SERVICE_REQUESTS.COSTS(requestId))),
      authServerService.getProfileServer(),
    ])

    request = (reqResp.data && (reqResp.data.data ?? reqResp.data)) || null
    costs = (costsResp.data && (costsResp.data.data ?? costsResp.data)) || []
    currentUser = profile ?? null
  } catch (err) {
    console.error('[UserServiceRequestDetail] server fetch error', err)
  }

  function normalizeAttachmentUrl(att: string) {
    if (!att || typeof att !== 'string') return att
    if (/^https?:\/\//i.test(att) || att.startsWith('//')) return att

    // Prefer same-origin proxied URL when running in browser
    const proxied = getPublicUrl(att)
    if (proxied) return proxied

    // Fallback to original value
    return att
  }

  // request, costs and profile are fetched server-side above

  // Status updates are handled by client-side action components when needed.

  // Message sending handled inside ServiceRequestMessages component; mutation removed

  // Derive frequently-used variables for rendering
  // messages variable not used here (ServiceRequestMessages handles messages)
  // totalCost/intlLocale removed; costs displayed individually instead

  // Guard: show loading / missing states
  if (!request) return <div className="p-8 text-center">{t('user_service_request.not_found')}</div>

  // Create timeline
  const timeline: TimelineEntry[] = (
    [
      {
        label: t('requests.service.timeline.created'),
        time: request.createdAt,
        by: request.createdByName ?? request.createdBy,
        icon: Plus,
        color: 'text-slate-600',
      },
      {
        label: t('requests.service.timeline.approved'),
        time: request.approvedAt,
        by: request.approvedByName ?? request.approvedBy,
        icon: CheckCircle2,
        color: 'text-emerald-600',
      },
      {
        label: t('requests.service.timeline.responded'),
        time: request.respondedAt,
        by: request.respondedByName ?? request.respondedBy,
        icon: Wrench,
        color: 'text-[var(--brand-600)]',
      },
      {
        label: t('requests.service.timeline.resolved'),
        time: request.resolvedAt,
        by: request.resolvedByName ?? request.resolvedBy,
        icon: CheckCircle2,
        color: 'text-emerald-600',
      },
      {
        label: t('requests.service.timeline.closed'),
        time: request.closedAt,
        by: request.closedByName ?? request.closedBy,
        icon: Package,
        color: 'text-slate-600',
      },
      {
        label: t('requests.service.timeline.customer_closed'),
        time: request.customerClosedAt,
        by: request.customerClosedByName ?? request.customerClosedBy,
        icon: XCircle,
        color: 'text-rose-500',
      },
    ] as TimelineEvent[]
  ).filter((event): event is TimelineEntry => Boolean(event.time))

  timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  // Main render
  return (
    <div className="w-full space-y-6 p-4 pb-20 md:p-6">
      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="text-muted-foreground -ml-2 h-8"
            >
              <Link href="/user/my-requests">
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{request.title}</h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
              {request.requestNumber ?? `#${request.id.slice(0, 8)}`}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">{formatDateTime(request.createdAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {request.createdByName ?? request.createdBy ?? t('user_service_request.guest')}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {t('user_service_request.management.assigned_to')}:{' '}
              {request.assignedToName ??
                request.assignedTo ??
                t('user_service_request.management.not_assigned')}
            </span>
          </div>
        </div>
        {/* Attachment preview modal removed in server-rendered page. Attachments open in new tab. */}

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="font-medium">
              {request.priority}
            </Badge>
            <Badge variant="outline" className="font-medium">
              {request.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="bg-slate-50/50 pb-3 dark:bg-slate-900/50">
              <CardTitle className="text-base font-medium">
                {t('user_service_request.description.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap md:text-base">
                {request.description || (
                  <span className="text-muted-foreground italic">
                    {t('user_service_request.description.empty')}
                  </span>
                )}
              </p>
              {Array.isArray(request.attachments) && request.attachments.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <ImageIcon className="text-muted-foreground h-4 w-4" />
                    <div className="text-sm font-medium">
                      {t('user_service_request.attachments.title', {
                        count: request.attachments.length,
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {request.attachments.map((att, idx) => {
                      const url = normalizeAttachmentUrl(att)
                      const isImage = /\.(png|jpe?g|gif|webp|avif)$/i.test(url)
                      return (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group bg-muted/10 flex h-28 w-full items-center justify-center overflow-hidden rounded border p-1"
                        >
                          {isImage ? (
                            <Image
                              src={url}
                              alt={`attachment-${idx}`}
                              width={360}
                              height={240}
                              className="max-h-full max-w-full object-contain"
                              unoptimized
                            />
                          ) : (
                            <div className="text-muted-foreground flex flex-col items-center gap-1 text-xs">
                              <FileText className="h-4 w-4" />
                              <span>{t('user_service_request.attachments.not_supported')}</span>
                            </div>
                          )}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rating */}
          {request.satisfactionScore && (
            <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader className="bg-slate-50/50 pb-3 dark:bg-slate-900/50">
                <CardTitle className="text-base font-medium">
                  {t('requests.service.rating.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ServiceRequestRatingDisplay
                  satisfactionScore={request.satisfactionScore}
                  customerFeedback={request.customerFeedback}
                />
              </CardContent>
            </Card>
          )}

          {/* Rating Button */}
          {!request.satisfactionScore && request.status === ServiceRequestStatus.CLOSED && (
            <ActionGuard pageId="user-my-requests" actionId="rate-service-request">
              <ServiceRequestRatingModal
                serviceRequest={request}
                onRated={() => {}}
                trigger={
                  <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                    <CardContent className="pt-6">
                      <div className="space-y-3 text-center">
                        <div className="text-muted-foreground text-sm">
                          {t('requests.service.rating.prompt')}
                        </div>
                        <Button className="w-full" size="sm">
                          {t('requests.service.rating.button')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                }
              />
            </ActionGuard>
          )}

          <ActionGuard pageId="user-my-requests" actionId="service-messages">
            <Card className="flex h-[600px] flex-col border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">
                  {t('user_service_request.messages.title')}
                </CardTitle>
                <CardDescription>{t('user_service_request.messages.description')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <div className="flex h-full flex-col">
                  <ServiceRequestMessagesServer
                    serviceRequestId={requestId}
                    currentUserId={currentUser?.user?.id ?? null}
                  />
                </div>
              </CardContent>
            </Card>
          </ActionGuard>

          <ActionGuard pageId="user-my-requests" actionId="service-costs">
            <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">
                    {t('user_service_request.costs.title')}
                  </CardTitle>
                  <CardDescription>{t('user_service_request.costs.description')}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {costs.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center text-sm">
                    {t('user_service_request.costs.empty')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {costs.map((cost) => (
                      <div
                        key={cost.id}
                        className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <div className="text-sm font-semibold">
                              {t('user_service_request.costs.voucher', { id: cost.id.slice(0, 8) })}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {formatDateTime(cost.createdAt)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-600">
                              {cost.totalAmount?.toLocaleString() ?? 0}{' '}
                              <span className="text-muted-foreground text-xs font-normal">
                                {cost.currency?.symbol ||
                                  cost.currency?.code ||
                                  (typeof cost.currency === 'string' ? cost.currency : 'USD')}
                              </span>
                            </div>
                          </div>
                        </div>
                        {cost.items?.length ? (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-transparent">
                                  <TableHead className="h-9 text-xs">
                                    {t('user_service_request.costs.table.type')}
                                  </TableHead>
                                  <TableHead className="h-9 text-xs">
                                    {t('user_service_request.costs.table.note')}
                                  </TableHead>
                                  <TableHead className="h-9 text-right text-xs">
                                    {t('user_service_request.costs.table.amount')}
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cost.items.map((it) => (
                                  <TableRow key={it.id} className="hover:bg-transparent">
                                    <TableCell className="py-2 text-xs font-medium">
                                      {it.type}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground py-2 text-xs">
                                      {it.note ?? '—'}
                                    </TableCell>
                                    <TableCell className="py-2 text-right text-xs tabular-nums">
                                      {it.amount?.toLocaleString()}{' '}
                                      <span className="text-muted-foreground text-xs">
                                        {typeof cost.currency === 'string'
                                          ? cost.currency
                                          : cost.currency?.code || 'USD'}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </ActionGuard>
        </div>

        <div className="space-y-6 lg:col-span-4">
          {request.status !== ServiceRequestStatus.CLOSED && (
            <ActionGuard pageId="user-my-requests" actionId="close-service-request">
              <Card className="border-l-4 border-l-blue-500 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                    {t('user_service_request.management.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <ServiceRequestManagementClient
                    requestId={requestId}
                    initialStatus={request.status}
                    assignedTo={request.assignedToName ?? request.assignedTo ?? null}
                  />
                </CardContent>
              </Card>
            </ActionGuard>
          )}

          <Card>
            <CardHeader className="bg-muted/20 border-b pt-4 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4" />
                {t('user_service_request.customer.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div>
                <div className="font-medium">{request.customer?.name ?? '—'}</div>
                {request.customer?.code && (
                  <div className="text-muted-foreground text-xs">{request.customer.code}</div>
                )}
              </div>
              <div className="grid gap-2 text-sm">
                <InfoRow
                  label={t('user_service_request.customer.email')}
                  value={request.customer?.contactEmail}
                />
                <InfoRow
                  label={t('user_service_request.customer.phone')}
                  value={request.customer?.contactPhone}
                />
                <InfoRow
                  label={t('user_service_request.customer.contact')}
                  value={request.customer?.contactPerson}
                />
              </div>
              {Array.isArray(request.customer?.address) && request.customer.address.length > 0 && (
                <div className="text-muted-foreground mt-2 border-t pt-2 text-xs">
                  {request.customer.address.map((addr, i) => (
                    <div key={i}>{addr}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/20 border-b pt-4 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Smartphone className="h-4 w-4" />
                {t('user_service_request.device.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {request.device ? (
                <div className="grid gap-2 text-sm">
                  <InfoRow label={t('table.model')} value={request.device.deviceModel?.name} />
                  <InfoRow label={t('table.serial')} value={request.device.serialNumber} />
                  <InfoRow
                    label={t('user_service_request.device.ip')}
                    value={request.device.ipAddress}
                  />
                  <InfoRow label={t('table.location')} value={request.device.location} />
                  <div className="pt-1">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {request.device.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm italic">
                  {t('user_service_request.device.not_linked')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="bg-slate-50/50 pb-3 dark:bg-slate-900/50">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Clock className="h-4 w-4" />
                {t('timeline.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {timeline.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  {t('timeline.empty')}
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800`}
                      >
                        <event.icon className={`h-4 w-4 ${event.color}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{event.label}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatDateTime(event.time)}
                          </p>
                        </div>
                        {event.by && (
                          <p className="text-muted-foreground text-xs">
                            {t('timeline.by')} {event.by}
                          </p>
                        )}
                        {event.reason && (
                          <p className="text-muted-foreground text-xs">
                            {t('timeline.reason')}: {event.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="max-w-[180px] truncate text-right text-sm font-medium" title={String(value)}>
        {value}
      </span>
    </div>
  )
}
