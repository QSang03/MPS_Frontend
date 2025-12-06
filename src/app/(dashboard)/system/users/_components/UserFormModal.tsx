'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { UserForm } from './UserForm'
import { useLocale } from '@/components/providers/LocaleProvider'

interface UserFormModalProps {
  customerId?: string // ✅ FIX: Thay từ required string thành optional
}

/**
 * User Form in a modal dialog
 */
export function UserFormModal({ customerId = '' }: UserFormModalProps) {
  // ✅ FIX: Thêm default value = '' để đảm bảo luôn là string
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg transition-all duration-300 hover:shadow-xl">
          <Plus className="h-5 w-5" /> {t('user.form_modal.add_user')}
        </Button>
      </DialogTrigger>

      <SystemModalLayout
        title={t('user.form_modal.title')}
        description={t('user.form_modal.description')}
        icon={Users}
        variant="create"
        maxWidth="!max-w-3xl"
      >
        <UserForm
          customerId={customerId}
          mode="create"
          onSuccess={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      </SystemModalLayout>
    </Dialog>
  )
}
