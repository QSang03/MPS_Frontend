'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import removeEmpty from '@/lib/utils/clean'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle, Layers } from 'lucide-react'
// Checkbox removed: not used in this component
import type { UserRole } from '@/types/users'

const roleSchema = z.object({
  name: z.string().min(1, 'Tên vai trò là bắt buộc'),
  description: z.string().optional(),
  level: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

type RoleFormData = z.infer<typeof roleSchema>

interface RoleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RoleFormData) => Promise<void>
  initialData?: Partial<UserRole> | null
}

export function RoleFormModal({ isOpen, onClose, onSubmit, initialData }: RoleFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLocale()

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      level: 0,
      isActive: true,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        description: initialData.description || '',
        level: initialData.level ?? 0,
        isActive: initialData.isActive ?? true,
      })
    } else {
      form.reset({ name: '', description: '', level: 0, isActive: true })
    }
  }, [initialData, form])

  const handleSubmit = async (data: RoleFormData) => {
    setIsLoading(true)
    try {
      // Clean data before submitting to avoid sending empty strings
      const payload = removeEmpty(data)
      await onSubmit(payload as RoleFormData)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <SystemModalLayout
        title={initialData ? t('role.form.title_edit') : t('role.form.title_create')}
        description={
          initialData ? t('role.form.description_edit') : t('role.form.description_create')
        }
        icon={Layers}
        variant={initialData ? 'edit' : 'create'}
        maxWidth="!max-w-[60vw]"
        footer={
          <>
            <Button type="button" variant="outline" onClick={onClose} className="min-w-[100px]">
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="role-form"
              disabled={isLoading}
              className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('button.processing')}
                </>
              ) : (
                <>{initialData ? t('role.button.save_changes') : t('role.button.create')}</>
              )}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form id="role-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Tên vai trò */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <Layers className="h-4 w-4 text-emerald-600" />
                    {t('role.field.name')} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('role.placeholder.name')}
                      {...field}
                      className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-[var(--color-success-500)] focus:ring-2 focus:ring-[var(--color-success-200)]"
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Mô tả */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <AlertCircle className="h-4 w-4 text-[var(--brand-600)]" />
                    {t('role.field.description')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('role.placeholder.description')}
                      {...field}
                      className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Grid: Level + Status */}
            <div className="grid grid-cols-2 gap-4">
              {/* Level */}
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <span className="text-lg">🔢</span>
                      {t('role.field.level')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('role.placeholder.level')}
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => {
                          const v = e.target.value
                          field.onChange(v === '' ? undefined : Number(v))
                        }}
                        className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-[var(--warning-500)] focus:ring-2 focus:ring-[var(--warning-200)]"
                      />
                    </FormControl>
                    <FormMessage className="mt-1 text-xs text-red-600" />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-success-600)]" />
                      {t('role.field.status')}
                    </FormLabel>
                    <FormControl>
                      <select
                        className="h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        value={String(field.value)}
                        onChange={(e) => field.onChange(e.target.value === 'true')}
                      >
                        <option value="true" className="bg-[var(--color-success-50)]">
                          {t('status.active')}
                        </option>
                        <option value="false" className="bg-red-50">
                          {t('status.inactive')}
                        </option>
                      </select>
                    </FormControl>
                    <FormMessage className="mt-1 text-xs text-red-600" />
                  </FormItem>
                )}
              />
            </div>

            {/* Info card */}
            <div className="rounded-lg border-2 border-[var(--color-success-200)] bg-gradient-to-r from-[var(--color-success-50)] to-[var(--brand-50)] p-4">
              <p className="text-xs text-gray-700">
                <span className="font-bold text-[var(--color-success-700)]">💡 {t('hint')}:</span>{' '}
                {t('role.tip.level_description')}
              </p>
            </div>
          </form>
        </Form>
      </SystemModalLayout>
    </Dialog>
  )
}
