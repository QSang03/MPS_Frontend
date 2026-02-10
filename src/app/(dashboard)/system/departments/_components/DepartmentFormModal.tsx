'use client'

import { useEffect, useState } from 'react'
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
import { Loader2, Building2, CheckCircle2, AlertCircle } from 'lucide-react'
// Checkbox removed: not used in this component
import type { Department } from '@/types/users'
import { useLocale } from '@/components/providers/LocaleProvider'

const deptSchema = z.object({
  name: z.string().min(1, 'Tên bộ phận là bắt buộc'),
  code: z.string().min(1, 'Mã là bắt buộc'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

type DepartmentFormData = z.infer<typeof deptSchema>

interface DepartmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: DepartmentFormData) => Promise<void>
  initialData?: Partial<Department> | null
}

export function DepartmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: DepartmentFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLocale()

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: '', code: '', description: '', isActive: true },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        code: initialData.code || '',
        description: initialData.description || '',
        isActive: initialData.isActive ?? true,
      })
    } else {
      form.reset({ name: '', code: '', description: '', isActive: true })
    }
  }, [initialData, form])

  const handleSubmit = async (data: DepartmentFormData) => {
    setIsLoading(true)
    try {
      const payload = removeEmpty(data)
      await onSubmit(payload as DepartmentFormData)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <SystemModalLayout
        title={initialData ? t('department.form.title_edit') : t('department.form.title_create')}
        description={
          initialData
            ? t('department.form.description_edit')
            : t('department.form.description_create')
        }
        icon={Building2}
        variant={initialData ? 'edit' : 'create'}
        maxWidth="!max-w-[55vw]"
        footer={
          <>
            <Button type="button" variant="outline" onClick={onClose} className="min-w-[100px]">
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="department-form"
              disabled={isLoading}
              className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('button.processing')}
                </>
              ) : (
                <>
                  {initialData
                    ? t('department.button.save_changes')
                    : t('department.button.create')}
                </>
              )}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form
            id="department-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            {/* Tên bộ phận */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <Building2 className="h-4 w-4 text-[var(--brand-600)]" />
                    {t('department.field.name')} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('department.placeholder.name')}
                      {...field}
                      className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Grid: Code + Status */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {/* Mã bộ phận */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <span className="text-lg">🔖</span>
                      {t('department.field.code')} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('department.placeholder.code')}
                        {...field}
                        className="h-10 rounded-lg border-2 border-gray-200 text-base uppercase transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
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
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {t('department.field.status')}
                    </FormLabel>
                    <FormControl>
                      <select
                        className="h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        value={String(field.value)}
                        onChange={(e) => field.onChange(e.target.value === 'true')}
                      >
                        <option value="true" className="bg-green-50">
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

            {/* Mô tả */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <AlertCircle className="h-4 w-4 text-sky-600" />
                    {t('department.field.description')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('department.placeholder.description')}
                      {...field}
                      className="h-10 rounded-lg border-2 border-gray-200 text-base transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Info card */}
            <div className="rounded-lg border-2 border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-100)] p-4">
              <p className="text-xs text-gray-700">
                <span className="font-bold text-[var(--brand-700)]">💡 {t('hint')}:</span>{' '}
                {t('department.tip.code_usage')}
              </p>
            </div>
          </form>
        </Form>
      </SystemModalLayout>
    </Dialog>
  )
}
