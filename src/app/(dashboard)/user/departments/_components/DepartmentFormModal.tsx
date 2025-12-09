'use client'

import * as React from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Department } from '@/types/users'

const departmentSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  code: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

type DepartmentFormSchema = z.infer<typeof departmentSchema>

export function DepartmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Department>) => Promise<void>
  initialData?: Department | null
}) {
  const { t } = useLocale()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DepartmentFormSchema>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      description: initialData?.description || '',
      isActive: initialData?.isActive ?? true,
    },
  })

  React.useEffect(() => {
    reset({
      name: initialData?.name || '',
      code: initialData?.code || '',
      description: initialData?.description || '',
      isActive: initialData?.isActive ?? true,
    })
  }, [initialData, reset])

  const submitForm = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
      onClose()
    } catch (err) {
      console.error('Submit department form error', err)
      toast.error(t('department.save_error'))
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('department.form.title_edit') : t('department.form.title_create')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {initialData
              ? t('department.form.description_edit')
              : t('department.form.description_create')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submitForm} className="grid gap-4 p-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {t('department.field.name')}
            </label>
            <Input {...register('name')} placeholder={t('department.placeholder.name')} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {t('department.field.code')}
            </label>
            <Input {...register('code')} placeholder={t('department.placeholder.code')} />
            {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {t('department.field.description')}
            </label>
            <Textarea
              {...register('description')}
              placeholder={t('department.placeholder.description')}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Checkbox {...register('isActive')} defaultChecked={initialData?.isActive ?? true} />
            <label className="text-sm font-medium text-gray-700">{t('status.active')}</label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose} type="button">
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {initialData ? t('department.button.save_changes') : t('department.button.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
