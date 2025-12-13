'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Key } from 'lucide-react'
import { usersClientService } from '@/lib/api/services/users-client.service'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '@/types/users'
// no local form usage anymore

interface Props {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onPasswordChanged?: (userId: string) => void
}

export default function ChangeUserPasswordModal({
  user,
  isOpen,
  onClose,
  onPasswordChanged,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()
  const { t } = useLocale()

  const handleResetToDefault = async () => {
    if (!user) return
    // Call backend reset-password endpoint which uses system default password
    setIsLoading(true)
    try {
      await usersClientService.resetPassword(user.id)
      toast.success(t('user.reset_password_success'))
      queryClient.invalidateQueries({ queryKey: ['users'] })
      if (onPasswordChanged) onPasswordChanged(user.id)
      onClose()
    } catch (err) {
      console.error('Reset user password error', err)
      const message = err instanceof Error ? err.message : t('user.reset_password_error')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <SystemModalLayout title={t('user.reset_password')} icon={Key} variant="view">
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-700">{t('user')}</div>
            <div className="text-sm text-gray-500">{user?.email || '—'}</div>
          </div>

          <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-800">{t('user.default_password')}</div>
                <div className="text-sm text-gray-600">
                  {process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD
                    ? process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD
                    : t('user.default_password_unconfigured')}
                </div>
              </div>
              <div className="flex gap-2">
                <ConfirmDialog
                  title={t('user.reset_password')}
                  description={t('user.reset_password_confirmation').replace(
                    '{email}',
                    user?.email || ''
                  )}
                  confirmLabel={t('confirm.reset')}
                  cancelLabel={t('cancel')}
                  onConfirm={handleResetToDefault}
                  trigger={
                    <Button variant="secondary" disabled={isLoading}>
                      {t('user.reset_password_action')}
                    </Button>
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              {t('button.close')}
            </Button>
          </div>
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
