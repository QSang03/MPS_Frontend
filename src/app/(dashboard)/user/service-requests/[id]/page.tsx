'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { ServiceRequestStatus } from '@/constants/status'
import type { ServiceRequestCost } from '@/types/models/service-request'
import { formatDateTime } from '@/lib/utils/formatters'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ServiceRequestMessages from '@/components/service-request/ServiceRequestMessages'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableHeader,
} from '@/components/ui/table'
// Dialog/Input imports removed (not used in user page)
import { useToast } from '@/components/ui/use-toast'
import { getClientUserProfile } from '@/lib/auth/client-auth'
import type { UserProfile } from '@/types/auth'
import { ArrowLeft, Smartphone, Building2, FileText, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ActionGuard } from '@/components/shared/ActionGuard'
// StatusBadge removed (not used)

export default function UserServiceRequestDetail() {
  const { t } = useLocale()
  const params = useParams()
  const requestId = params.id as string
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [statusUpdate, setStatusUpdate] = useState<ServiceRequestStatus | ''>('')
  const [actionNote, setActionNote] = useState('')
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getClientUserProfile()
      .then((u) => {
        if (mounted) setCurrentUser(u)
      })
      .catch(() => {
        if (mounted) setCurrentUser(null)
      })
    return () => {
      mounted = false
    }
  }, [])

  function normalizeAttachmentUrl(att: string) {
    if (!att || typeof att !== 'string') return att
    if (/^https?:\/\//i.test(att) || att.startsWith('//')) return att
    const path = att.startsWith('/') ? att : `/${att}`
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
    if (!base) return path
    return `${base}${path}`
  }

  // Fetch request detail
  const { data: request, isLoading } = useQuery({
    queryKey: ['service-request', requestId],
    queryFn: () => serviceRequestsClientService.getById(requestId),
  })

  // Messages are rendered by ServiceRequestMessages component; no local query needed

  // Fetch costs (if any) separately
  const { data: costsData } = useQuery({
    queryKey: ['service-request-costs', requestId],
    queryFn: () => serviceRequestsClientService.getCosts(requestId),
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!statusUpdate) return
      return serviceRequestsClientService.updateStatus(requestId, {
        status: statusUpdate,
        customerInitiatedClose: statusUpdate === ServiceRequestStatus.CLOSED,
        customerCloseReason: actionNote,
      })
    },
    onSuccess: () => {
      toast({ title: t('user_service_request.update_status.success') })
      queryClient.invalidateQueries({ queryKey: ['service-request', requestId] })
      setStatusUpdate('')
      setActionNote('')
    },
    onError: () => {
      toast({ title: t('user_service_request.update_status.error'), variant: 'destructive' })
    },
  })

  // Message sending handled inside ServiceRequestMessages component; mutation removed

  // Derive frequently-used variables for rendering
  // messages variable not used here (ServiceRequestMessages handles messages)
  const costs: ServiceRequestCost[] = costsData?.data ?? []
  // totalCost/intlLocale removed; costs displayed individually instead

  // Guard: show loading / missing states
  if (isLoading) return <div className="p-8 text-center">{t('loading.default')}</div>
  if (!request) return <div className="p-8 text-center">{t('user_service_request.not_found')}</div>

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
          </div>
        </div>
        <Dialog
          open={Boolean(selectedAttachment)}
          onOpenChange={(open) => !open && setSelectedAttachment(null)}
        >
          <DialogContent className="max-w-6xl p-0">
            <DialogHeader>
              <DialogTitle>{t('user_service_request.attachment.title')}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              {selectedAttachment && (
                <div
                  style={{ maxHeight: '80vh', width: 'auto', maxWidth: '100%' }}
                  className="relative"
                >
                  <Image
                    src={selectedAttachment}
                    alt="attachment"
                    width={1200}
                    height={800}
                    unoptimized
                    className="max-h-[80vh] max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

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
                        <button
                          key={idx}
                          onClick={() => isImage && setSelectedAttachment(url)}
                          type="button"
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
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                  <ServiceRequestMessages
                    serviceRequestId={requestId}
                    currentUserId={currentUser?.user?.id ?? null}
                    pageId="user-my-requests"
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
                  <div className="space-y-2">
                    <label className="text-sm leading-none font-medium">
                      {t('user_service_request.management.status_label')}
                    </label>
                    <div className="space-y-2">
                      <Select
                        value={request.status}
                        onValueChange={(v) => setStatusUpdate(v as ServiceRequestStatus)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t('user_service_request.management.status_placeholder')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ServiceRequestStatus.CLOSED}>
                            {t('user_service_request.management.close_request')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder={t('user_service_request.management.action_note_placeholder')}
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        className="w-full bg-white"
                        rows={3}
                      />
                      <Button
                        className="w-full"
                        onClick={() => updateStatusMutation.mutate()}
                        disabled={!statusUpdate || updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending
                          ? t('user_service_request.management.updating')
                          : t('user_service_request.management.update')}
                      </Button>
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <div className="bg-muted rounded p-2 text-sm font-medium">
                      {t('user_service_request.management.assigned_to')}:{' '}
                      {request.assignedToName ??
                        request.assignedTo ??
                        t('user_service_request.management.not_assigned')}
                    </div>
                  </div>
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
