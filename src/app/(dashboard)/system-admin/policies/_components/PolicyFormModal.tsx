'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Loader2, Settings } from 'lucide-react'
import type { Policy } from '@/types/policies'

const policySchema = z.object({
  name: z.string().min(1, 'Tên policy là bắt buộc'),
  effect: z.string().min(1),
  actions: z.string().optional(), // comma separated
  subject: z.string().optional(), // JSON
  resource: z.string().optional(), // JSON
  conditions: z.string().optional(), // JSON
})

type PolicyFormData = z.infer<typeof policySchema>

interface PolicyFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Policy>) => Promise<void>
  initialData?: Partial<Policy> | null
}

export function PolicyFormModal({ isOpen, onClose, onSubmit, initialData }: PolicyFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      name: '',
      effect: 'ALLOW',
      actions: '',
      subject: '',
      resource: '',
      conditions: '',
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        effect: initialData.effect || 'ALLOW',
        actions: (initialData.actions || []).join(', '),
        subject: initialData.subject ? JSON.stringify(initialData.subject, null, 2) : '',
        resource: initialData.resource ? JSON.stringify(initialData.resource, null, 2) : '',
        conditions: initialData.conditions ? JSON.stringify(initialData.conditions, null, 2) : '',
      })
    } else {
      form.reset({
        name: '',
        effect: 'ALLOW',
        actions: '',
        subject: '',
        resource: '',
        conditions: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  const handleSubmit = async (data: PolicyFormData) => {
    setIsLoading(true)
    try {
      // Parse JSON fields if provided
      const parsed: Partial<Policy> = {
        name: data.name,
        effect: data.effect,
        actions: data.actions ? data.actions.split(',').map((s) => s.trim()) : [],
      }

      try {
        parsed.subject = data.subject ? JSON.parse(data.subject) : {}
      } catch {
        // ignore parse errors — backend will validate
        parsed.subject = {}
      }

      try {
        parsed.resource = data.resource ? JSON.parse(data.resource) : {}
      } catch {
        parsed.resource = {}
      }

      try {
        parsed.conditions = data.conditions ? JSON.parse(data.conditions) : {}
      } catch {
        parsed.conditions = {}
      }

      await onSubmit(parsed)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {initialData ? 'Chỉnh sửa policy' : 'Thêm policy'}
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Cập nhật policy' : 'Tạo policy mới'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên policy</FormLabel>
                  <FormControl>
                    <Input placeholder="Tên policy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effect</FormLabel>
                  <FormControl>
                    <select className="input w-full rounded-md border px-3 py-2" {...field}>
                      <option value="ALLOW">ALLOW</option>
                      <option value="DENY">DENY</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actions (comma separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="read, write, delete" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (JSON)</FormLabel>
                  <FormControl>
                    <textarea
                      className="input h-28 w-full resize-none rounded-md border p-2"
                      placeholder='{"attributes.department": {"$eq": "tech"}}'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource (JSON)</FormLabel>
                  <FormControl>
                    <textarea
                      className="input h-28 w-full resize-none rounded-md border p-2"
                      placeholder='{"type": {"$eq": "report"}}'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conditions (JSON)</FormLabel>
                  <FormControl>
                    <textarea
                      className="input h-28 w-full resize-none rounded-md border p-2"
                      placeholder='{"environment.ipAddress": {"$regex": "^192\\.168\\."}}'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Lưu' : 'Tạo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
