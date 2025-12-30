'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Form, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createLeadSchema, type CreateLeadDto } from '@/lib/validations/lead.schema'
import { createLead } from '@/lib/api/leads'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function LeadModal({ children }: { children: React.ReactNode }) {
  const { t } = useLocale()

  const form = useForm<CreateLeadDto>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      company: '',
      message: '',
    },
  })

  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const onSubmit = async (values: CreateLeadDto) => {
    setIsSubmitting(true)
    try {
      await createLead(values)
      toast.success(t('landing.lead_modal.success') || 'Gửi yêu cầu thành công')
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error('Lead submit error', error)
      toast.error(t('landing.lead_modal.error') || 'Gửi thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('landing.lead_modal.title') || 'Nhận tư vấn & báo giá'}</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3" noValidate>
              <FormField
                name="fullName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('landing.lead_modal.fields.fullName') || 'Họ tên'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('landing.lead_modal.placeholders.fullName') || 'Họ và tên'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('landing.lead_modal.fields.email') || 'Email'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          t('landing.lead_modal.placeholders.email') || 'you@example.com'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('landing.lead_modal.fields.phone') || 'Số điện thoại'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('landing.lead_modal.placeholders.phone') || '0123 456 789'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="company"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('landing.lead_modal.fields.company') || 'Công ty'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          t('landing.lead_modal.placeholders.company') || 'Tên công ty (tuỳ chọn)'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="message"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('landing.lead_modal.fields.message') || 'Nội dung'}</FormLabel>
                    <FormControl>
                      <textarea
                        className="min-h-[80px] resize-y rounded-md border bg-transparent p-3 text-sm"
                        placeholder={
                          t('landing.lead_modal.placeholders.message') || 'Mô tả nhu cầu (tuỳ chọn)'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  {t('button.cancel') || 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-[#135bec] px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {isSubmitting
                    ? t('button.processing') || 'Đang xử lý...'
                    : t('landing.lead_modal.buttons.submit') || 'Gửi yêu cầu'}
                </button>
              </DialogFooter>
            </form>
          </Form>
        </div>

        <DialogClose />
      </DialogContent>
    </Dialog>
  )
}
