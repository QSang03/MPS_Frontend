'use client'

import { useEffect, useState } from 'react'
import type { Device } from '@/types/models/device'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { DEVICE_STATUS } from '@/constants/status'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface Props {
  device?: Device | null
  targetActive: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (updated: Device) => void
}

export default function ToggleActiveModal({
  device,
  targetActive,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const { t } = useLocale()
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [inactiveReasonOption, setInactiveReasonOption] = useState<string>('')
  const [inactiveReasonText, setInactiveReasonText] = useState<string>('')

  useEffect(() => {
    if (!device) return
    setStatus(String(device.status ?? ''))
    setInactiveReasonOption(String(device.inactiveReason ?? ''))
    setInactiveReasonText(String(device.inactiveReason ?? ''))
  }, [device, targetActive])

  const handleConfirm = async () => {
    if (!device || !device.id) return
    if (!targetActive) {
      const chosen = inactiveReasonOption === '__other' ? inactiveReasonText : inactiveReasonOption
      if (!chosen || chosen.trim() === '') {
        toast.error(t('toggle_active.modal.error.reason_required'))
        return
      }
    }

    setSubmitting(true)
    const chosenStatus = String(
      status ||
        device.status ||
        (targetActive ? DEVICE_STATUS.ACTIVE : DEVICE_STATUS.DECOMMISSIONED)
    ).toUpperCase()

    const payload: Record<string, unknown> = {
      isActive: targetActive,
      status: chosenStatus,
      inactiveReason: !targetActive
        ? inactiveReasonOption === '__other'
          ? inactiveReasonText
          : inactiveReasonOption
        : undefined,
    }

    try {
      const updated = (await devicesClientService.update(
        String(device.id),
        payload as unknown as Record<string, unknown>
      )) as Device
      toast.success(t('toggle_active.modal.success'))
      onSuccess?.(updated)
      onOpenChange(false)
    } catch (err) {
      console.error('Toggle device active error', err)
      toast.error(t('toggle_active.modal.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!device) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={
          targetActive
            ? t('toggle_active.modal.title.activate')
            : t('toggle_active.modal.title.deactivate')
        }
        description={
          targetActive
            ? t('toggle_active.modal.description.activate')
            : t('toggle_active.modal.description.deactivate')
        }
        icon={targetActive ? CheckCircle2 : XCircle}
        variant="edit"
        footer={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                  className="min-w-[100px] cursor-pointer"
                >
                  {t('cancel')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('cancel')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  form="toggle-active-form"
                  disabled={submitting}
                  className="min-w-[120px] cursor-pointer bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
                >
                  {submitting
                    ? t('toggle_active.modal.button.processing')
                    : targetActive
                      ? t('toggle_active.modal.button.activate')
                      : t('toggle_active.modal.button.deactivate')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {targetActive
                    ? t('toggle_active.modal.button.activate')
                    : t('toggle_active.modal.button.deactivate')}
                </p>
              </TooltipContent>
            </Tooltip>
          </>
        }
      >
        <form
          id="toggle-active-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleConfirm()
          }}
          className="space-y-6"
        >
          <div>
            <Label className="text-sm font-semibold">{t('toggle_active.device')}</Label>
            <div className="mt-1 truncate text-sm font-medium text-gray-900">
              {String(device?.serialNumber ?? device?.id ?? '')}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">{t('toggle_active.status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t('device.form.status_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {targetActive ? (
                  <>
                    <SelectItem value="ACTIVE">{t('device.status.active')}</SelectItem>
                    <SelectItem value="MAINTENANCE">{t('device.status.maintenance')}</SelectItem>
                    <SelectItem value="ERROR">{t('device.status.error')}</SelectItem>
                    <SelectItem value="OFFLINE">{t('device.status.offline')}</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="DECOMMISSIONED">
                      {t('device.status.decommissioned')}
                    </SelectItem>
                    <SelectItem value="SUSPENDED">{t('device.status.suspended')}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {!targetActive && (
            <div>
              <Label className="text-sm font-semibold">{t('toggle_active.reason')}</Label>
              <Select value={inactiveReasonOption} onValueChange={setInactiveReasonOption}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t('device.form.reason_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tạm dừng do lỗi">
                    {t('toggle_active.modal.reason.pause_error')}
                  </SelectItem>
                  <SelectItem value="Hủy HĐ">
                    {t('toggle_active.modal.reason.cancel_contract')}
                  </SelectItem>
                  <SelectItem value="Hoàn tất HĐ">
                    {t('toggle_active.modal.reason.complete_contract')}
                  </SelectItem>
                  <SelectItem value="__other">{t('device.form.reason.other')}</SelectItem>
                </SelectContent>
              </Select>

              {inactiveReasonOption === '__other' && (
                <Input
                  value={inactiveReasonText}
                  onChange={(e) => setInactiveReasonText(e.target.value)}
                  placeholder={t('device.form.reason.other_placeholder')}
                  className="mt-2 h-11"
                  autoFocus
                />
              )}
            </div>
          )}
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}
