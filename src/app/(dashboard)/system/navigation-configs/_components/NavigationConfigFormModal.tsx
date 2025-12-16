'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type {
  NavigationConfig,
  CreateNavigationConfigDto,
  UpdateNavigationConfigDto,
} from '@/types/navigation-config'
import { Settings, Loader2, Save, Menu, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { toast } from 'sonner'
import { navigationConfigService } from '@/lib/api/services/navigation-config.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { useQuery } from '@tanstack/react-query'
import { NAVIGATION_PAYLOAD, USER_NAVIGATION_PAYLOAD } from '@/constants/navigation'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import type { Customer } from '@/types/models/customer'
import type { UserRole } from '@/types/users'
import type { NavActionPayload, NavItemPayload } from '@/constants/navigation'
import { ActionGuard } from '@/components/shared/ActionGuard'

interface Props {
  config: NavigationConfig | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export default function NavigationConfigFormModal({ config, open, onOpenChange, onSaved }: Props) {
  const { t, locale } = useLocale()
  const queryClient = useQueryClient()
  const isEdit = !!config

  // Load customers for selector (backend max limit is 100)
  const { data: customersData } = useQuery({
    queryKey: ['customers', 'list'],
    queryFn: () => customersClientService.getAll({ limit: 100 }),
    enabled: open,
  })

  // Load roles for selector
  const { data: rolesData } = useQuery({
    queryKey: ['roles', 'list'],
    queryFn: () => rolesClientService.getRoles({ limit: 100, isActive: true }),
    enabled: open,
  })

  // Compute initial form state based on config
  const getInitialFormState = React.useCallback(() => {
    if (config) {
      // Map existing config items and actions to enabled state
      const enabledItems = new Set<string>()
      const enabledActions = new Map<string, Set<string>>()

      config.config?.items?.forEach((item) => {
        enabledItems.add(item.id)
        if (item.actions && item.actions.length > 0) {
          const actionSet = new Set<string>()
          item.actions.forEach((action) => {
            actionSet.add(action.id)
          })
          enabledActions.set(item.id, actionSet)
        }
      })

      return {
        name: config.name,
        description: config.description || '',
        version: config.version,
        isActive: config.isActive,
        customerId: config.customerId || null,
        roleId: config.roleId || null,
        enabledItems,
        enabledActions,
      }
    }
    // Default: all items and all actions enabled
    const enabledItems = new Set(NAVIGATION_PAYLOAD.map((item) => item.id))
    const enabledActions = new Map<string, Set<string>>()
    NAVIGATION_PAYLOAD.forEach((item) => {
      if (item.actions && item.actions.length > 0) {
        enabledActions.set(item.id, new Set(item.actions.map((a) => a.id)))
      }
    })
    return {
      name: '',
      description: '',
      version: '1.0.0',
      isActive: true,
      customerId: null,
      roleId: null,
      enabledItems,
      enabledActions,
    }
  }, [config])

  const inferDefaultNavMode = (items?: { id?: string }[] | null): 'system' | 'user' => {
    if (!items || items.length === 0) return 'system'
    const hasUserIds = items.some((it) => typeof it.id === 'string' && it.id.startsWith('user-'))
    return hasUserIds ? 'user' : 'system'
  }

  const [defaultNavMode, setDefaultNavMode] = useState<'system' | 'user'>(
    config?.customerId ? 'system' : inferDefaultNavMode(config?.config?.items)
  )
  const [form, setForm] = useState(getInitialFormState)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const selectedCustomer: Customer | undefined =
    form.customerId && customersData?.data
      ? customersData.data.find((c) => c.id === form.customerId)
      : undefined
  const isSysCustomer = selectedCustomer?.code === 'SYS'

  const dedupeActions = (actions: NavActionPayload[] = []) => {
    const map = new Map<string, NavActionPayload>()
    actions.forEach((a) => {
      if (!map.has(a.id)) map.set(a.id, a)
    })
    return Array.from(map.values())
  }

  const normalizePayload = (payload: NavItemPayload[]) =>
    payload.map((item) => ({
      ...item,
      actions: item.actions ? dedupeActions(item.actions) : [],
    }))

  const filteredRoles: UserRole[] | undefined = rolesData?.data
    ? rolesData.data.filter((role) => {
        // Không chọn customer -> không hạn chế role
        if (!form.customerId) return true
        if (isSysCustomer) return true
        const normalized = (role.name || '').trim().toLowerCase()
        return normalized === 'manager' || normalized === 'user'
      })
    : undefined

  // Determine which navigation payload to use based on customer
  // customerId = null (default) -> NAVIGATION_PAYLOAD (admin)
  // customerId != null and customer.code !== "SYS" -> USER_NAVIGATION_PAYLOAD (user)
  // customerId != null and customer.code === "SYS" -> NAVIGATION_PAYLOAD (admin)
  const getNavigationPayload = (
    customerId: string | null,
    mode: 'system' | 'user' = defaultNavMode
  ) => {
    if (!customerId) {
      return mode === 'system' ? NAVIGATION_PAYLOAD : USER_NAVIGATION_PAYLOAD
    }
    // Check if customer is SYS (default system customer)
    const customer = customersData?.data?.find((c) => c.id === customerId)
    if (customer?.code === 'SYS') {
      return NAVIGATION_PAYLOAD
    }
    // Regular customer -> user navigation
    return USER_NAVIGATION_PAYLOAD
  }

  const getNormalizedPayload = (
    customerId: string | null,
    mode: 'system' | 'user' = defaultNavMode
  ) => normalizePayload(getNavigationPayload(customerId, mode))

  const currentPayload = getNormalizedPayload(form.customerId)

  // Reset form when switching between create/edit or when modal reopened with new config
  React.useEffect(() => {
    const nextMode = config?.customerId ? 'system' : inferDefaultNavMode(config?.config?.items)
    setDefaultNavMode(nextMode)
    setForm(getInitialFormState())
    setSearchTerm('')
    setExpandedItems(new Set())
  }, [config?.id, config?.customerId, config?.config?.items, open, getInitialFormState])

  // Helper to reset navigation items when customer changes
  const resetNavigationForCustomer = (customerId: string | null) => {
    const newPayload = getNormalizedPayload(customerId)
    const newEnabledItems = new Set(newPayload.map((item) => item.id))
    const newEnabledActions = new Map<string, Set<string>>()
    newPayload.forEach((item) => {
      if (item.actions && item.actions.length > 0) {
        newEnabledActions.set(item.id, new Set(item.actions.map((a) => a.id)))
      }
    })
    return { enabledItems: newEnabledItems, enabledActions: newEnabledActions }
  }

  // Filter navigation items by search term
  const filteredItems = currentPayload.filter((item) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      // Use localized label/description for search when available
      (locale === 'en'
        ? item.labelEn || item.label
        : locale === 'vi'
          ? item.labelVi || item.label
          : item.label
      )
        .toLowerCase()
        .includes(search) ||
      item.id?.toLowerCase().includes(search) ||
      (locale === 'en'
        ? item.descriptionEn || item.description || ''
        : locale === 'vi'
          ? item.descriptionVi || item.description || ''
          : item.description || ''
      )
        .toLowerCase()
        .includes(search) ||
      item.route?.toLowerCase().includes(search)
    )
  })

  const toggleItem = (itemId: string) => {
    setForm((prev) => {
      const newEnabled = new Set(prev.enabledItems)
      if (newEnabled.has(itemId)) {
        newEnabled.delete(itemId)
        // Also remove actions when item is disabled
        const newActions = new Map(prev.enabledActions)
        newActions.delete(itemId)
        return { ...prev, enabledItems: newEnabled, enabledActions: newActions }
      } else {
        newEnabled.add(itemId)
        // Enable all actions when item is enabled
        const currentPayload = getNormalizedPayload(prev.customerId)
        const item = currentPayload.find((i) => i.id === itemId)
        const newActions = new Map(prev.enabledActions)
        if (item?.actions && item.actions.length > 0) {
          newActions.set(itemId, new Set(item.actions.map((a) => a.id)))
        }
        return { ...prev, enabledItems: newEnabled, enabledActions: newActions }
      }
    })
  }

  const toggleAction = (itemId: string, actionId: string) => {
    setForm((prev) => {
      const newActions = new Map(prev.enabledActions)
      const itemActions = new Set(newActions.get(itemId) || [])
      if (itemActions.has(actionId)) {
        itemActions.delete(actionId)
      } else {
        itemActions.add(actionId)
      }
      newActions.set(itemId, itemActions)
      return { ...prev, enabledActions: newActions }
    })
  }

  const toggleAllActions = (itemId: string) => {
    setForm((prev) => {
      const currentPayload = getNavigationPayload(prev.customerId)
      const item = currentPayload.find((i) => i.id === itemId)
      if (!item?.actions || item.actions.length === 0) return prev

      const newActions = new Map(prev.enabledActions)
      const currentActions = newActions.get(itemId) || new Set()
      const allEnabled = item.actions.every((a) => currentActions.has(a.id))

      if (allEnabled) {
        // Disable all actions
        newActions.set(itemId, new Set())
      } else {
        // Enable all actions
        newActions.set(itemId, new Set(item.actions.map((a) => a.id)))
      }
      return { ...prev, enabledActions: newActions }
    })
  }

  const toggleAll = () => {
    setForm((prev) => {
      const allEnabled = filteredItems.every((item) => prev.enabledItems.has(item.id))
      const newEnabled = new Set(prev.enabledItems)
      const newActions = new Map(prev.enabledActions)
      if (allEnabled) {
        // Disable all filtered items
        filteredItems.forEach((item) => {
          newEnabled.delete(item.id)
          newActions.delete(item.id)
        })
      } else {
        // Enable all filtered items and their actions
        filteredItems.forEach((item) => {
          newEnabled.add(item.id)
          if (item.actions && item.actions.length > 0) {
            newActions.set(item.id, new Set(item.actions.map((a) => a.id)))
          }
        })
      }
      return { ...prev, enabledItems: newEnabled, enabledActions: newActions }
    })
  }

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateNavigationConfigDto) => navigationConfigService.create(data),
    onSuccess: () => {
      toast.success(t('navigation_config.create_success'))
      queryClient.invalidateQueries({ queryKey: ['navigation-configs'] })
      onSaved?.()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      console.error('Create navigation config failed', error)
      toast.error(t('navigation_config.create_error'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateNavigationConfigDto) =>
      navigationConfigService.update(config!.id, data),
    onSuccess: () => {
      toast.success(t('navigation_config.update_success'))
      queryClient.invalidateQueries({ queryKey: ['navigation-configs'] })
      queryClient.invalidateQueries({ queryKey: ['navigation'] })
      onSaved?.()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      console.error('Update navigation config failed', error)
      toast.error(t('navigation_config.update_error'))
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Build config items from enabled items with filtered actions
    const currentPayload = getNavigationPayload(form.customerId)
    const enabledItemsList = currentPayload
      .filter((item) => form.enabledItems.has(item.id))
      .map((item) => {
        const enabledActionIds = form.enabledActions.get(item.id) || new Set()
        // Filter actions to only include enabled ones
        const filteredActions = item.actions?.filter((action) => enabledActionIds.has(action.id))
        return {
          ...item,
          actions: filteredActions || [],
        }
      })

    const payload = {
      name: form.name,
      description: form.description || undefined,
      version: form.version,
      isActive: form.isActive,
      customerId: form.customerId || null,
      roleId: form.roleId || null,
      config: {
        items: enabledItemsList,
        metadata: {},
      },
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  // Use key to force remount when config changes, avoiding setState in effect
  const dialogKey = config?.id || 'new'

  // Get icon component
  type IconComp = React.ComponentType<{ className?: string }>
  const getIconComponent = (iconName?: string): IconComp => {
    if (!iconName) return Icons.LayoutDashboard as IconComp
    const comp = (Icons as unknown as Record<string, IconComp>)[iconName]
    if (comp) return comp
    return Icons.LayoutDashboard as IconComp
  }

  const allFilteredEnabled = filteredItems.every((item) => form.enabledItems.has(item.id))

  return (
    <Dialog key={dialogKey} open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={isEdit ? t('navigation_config.edit_title') : t('navigation_config.create_title')}
        description={
          isEdit ? t('navigation_config.edit_subtitle') : t('navigation_config.create_subtitle')
        }
        icon={Settings}
        variant={isEdit ? 'edit' : 'create'}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="navigation-config-form"
              disabled={isLoading || !form.name || form.enabledItems.size === 0}
              className="bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? t('common.update') : t('common.create')}
                </>
              )}
            </Button>
          </>
        }
      >
        <form id="navigation-config-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('navigation_config.fields.name')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('navigation_config.placeholder.name')}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('navigation_config.fields.description')}</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('navigation_config.placeholder.description')}
              rows={2}
            />
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <Label htmlFor="customerId">{t('navigation_config.fields.customer')}</Label>
            <ActionGuard
              pageId="navigation-configs"
              actionId="view-all-customers"
              fallback={
                <p className="text-xs text-gray-500">
                  {t('navigation_config.helper.customer_create')}
                </p>
              }
            >
              <Select
                value={form.customerId || 'default'}
                onValueChange={(value) => {
                  const newCustomerId = value === 'default' ? null : value
                  const newCustomer =
                    newCustomerId && customersData?.data
                      ? customersData.data.find((c) => c.id === newCustomerId)
                      : undefined
                  const newIsSys = newCustomer?.code === 'SYS'

                  // Determine allowed roles for the new customer selection
                  const allowedRoles =
                    rolesData?.data?.filter((role) => {
                      if (!newCustomerId) return true
                      if (newIsSys) return true
                      const normalized = (role.name || '').trim().toLowerCase()
                      return normalized === 'manager' || normalized === 'user'
                    }) ?? []

                  // Reset roleId if current selection is not allowed under new customer
                  const nextRoleId =
                    form.roleId && allowedRoles.some((r) => r.id === form.roleId)
                      ? form.roleId
                      : null

                  // Reset navigation items when customer changes (only when not editing)
                  if (!isEdit) {
                    const reset = resetNavigationForCustomer(newCustomerId)
                    setForm({ ...form, customerId: newCustomerId, roleId: nextRoleId, ...reset })
                  } else {
                    setForm({ ...form, customerId: newCustomerId, roleId: nextRoleId })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('navigation_config.placeholder.customer_select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t('navigation_config.default_display')}</SelectItem>
                  {customersData?.data?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">{t('navigation_config.helper.customer')}</p>
            </ActionGuard>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="roleId">{t('navigation_config.fields.role')}</Label>
            <ActionGuard
              pageId="navigation-configs"
              actionId="view-all-roles"
              fallback={
                <p className="text-xs text-gray-500">
                  {t('navigation_config.helper.roles_create')}
                </p>
              }
            >
              <Select
                value={form.roleId || 'default'}
                onValueChange={(value) => {
                  const newRoleId = value === 'default' ? null : value
                  setForm({ ...form, roleId: newRoleId })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('navigation_config.placeholder.role_select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t('navigation_config.default_display')}</SelectItem>
                  {filteredRoles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">{t('navigation_config.helper.roles')}</p>
            </ActionGuard>
          </div>

          {/* Default navigation mode when no customer selected */}
          {!form.customerId && (
            <div className="space-y-2">
              <Label>
                {t('navigation_config.fields.default_navigation_type') ||
                  'Loại navigation (khi không chọn khách hàng)'}
              </Label>
              <Select
                value={defaultNavMode}
                onValueChange={(value) => {
                  const mode = value === 'user' ? 'user' : 'system'
                  setDefaultNavMode(mode)
                  const reset = getNormalizedPayload(null, mode)
                  const newEnabledItems = new Set(reset.map((item) => item.id))
                  const newEnabledActions = new Map<string, Set<string>>()
                  reset.forEach((item) => {
                    if (item.actions && item.actions.length > 0) {
                      newEnabledActions.set(item.id, new Set(item.actions.map((a) => a.id)))
                    }
                  })
                  setForm((prev) => ({
                    ...prev,
                    customerId: null,
                    enabledItems: newEnabledItems,
                    enabledActions: newEnabledActions,
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      (t('navigation_config.placeholder.default_navigation_type') as string) ||
                      'Chọn loại navigation mặc định'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">
                    {t('navigation_config.navigation_type.admin') || 'System (admin)'}
                  </SelectItem>
                  <SelectItem value="user">
                    {t('navigation_config.navigation_type.user') || 'User'}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {t('navigation_config.helper.default_navigation_type') ||
                  'Khi chưa chọn khách hàng, bạn có thể chọn dùng navigation System hoặc User.'}
              </p>
            </div>
          )}

          {/* Version */}
          <div className="space-y-2">
            <Label htmlFor="version">
              {t('navigation_config.fields.version')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="version"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              placeholder="1.0.0"
              required
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">{t('navigation_config.fields.is_active')}</Label>
              <p className="text-xs text-gray-500">{t('navigation_config.helper.is_active')}</p>
            </div>
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
            />
          </div>

          <Separator />

          {/* Navigation Items Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Menu className="h-5 w-5" />
                  {t('navigation_config.items.title')}
                </Label>
                <p className="mt-1 text-xs text-gray-500">
                  {t('navigation_config.items.description')}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleAll}
                className="text-xs"
              >
                {allFilteredEnabled
                  ? t('navigation_config.actions.disable_all')
                  : t('navigation_config.actions.enable_all')}
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('navigation_config.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Items List */}
            <div className="max-h-[600px] space-y-2 overflow-y-auto rounded-lg border bg-gray-50 p-4">
              {filteredItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  {t('navigation_config.no_items')}
                </p>
              ) : (
                filteredItems.map((item) => {
                  const Icon = getIconComponent(item.icon)
                  const isEnabled = form.enabledItems.has(item.id)
                  const isExpanded = expandedItems.has(item.id)
                  const hasActions = item.actions && item.actions.length > 0
                  const enabledActionIds = form.enabledActions.get(item.id) || new Set()
                  const allActionsEnabled =
                    hasActions && item.actions!.every((a) => enabledActionIds.has(a.id))

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'rounded-lg border-2 transition-colors',
                        isEnabled
                          ? 'border-[var(--brand-200)] bg-white'
                          : 'border-gray-200 bg-gray-100'
                      )}
                    >
                      {/* Item Header */}
                      <div className="flex items-center justify-between p-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {hasActions && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className="shrink-0 text-gray-400 hover:text-gray-600"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <Icon className="h-5 w-5 shrink-0 text-gray-600" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-gray-900">
                              {locale === 'en'
                                ? item.labelEn || item.label
                                : locale === 'vi'
                                  ? item.labelVi || item.label
                                  : item.label}
                            </div>
                            {(locale === 'en'
                              ? item.descriptionEn || item.description
                              : locale === 'vi'
                                ? item.descriptionVi || item.description
                                : item.description) && (
                              <div className="truncate text-xs text-gray-500">
                                {locale === 'en'
                                  ? item.descriptionEn || item.description
                                  : locale === 'vi'
                                    ? item.descriptionVi || item.description
                                    : item.description}
                              </div>
                            )}
                            <div className="mt-1 text-xs text-gray-400">{item.route}</div>
                            {hasActions && (
                              <div className="mt-1 text-xs text-gray-400">
                                {item.actions!.length} actions
                                {isEnabled && (
                                  <span className="ml-1">({enabledActionIds.size} enabled)</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Switch checked={isEnabled} onCheckedChange={() => toggleItem(item.id)} />
                      </div>

                      {/* Actions List (Collapsible) */}
                      {hasActions && isExpanded && isEnabled && (
                        <div className="border-t border-gray-200 bg-gray-50 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">
                              {t('navigation_config.actions_label')}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAllActions(item.id)}
                              className="h-6 text-xs"
                            >
                              {allActionsEnabled
                                ? t('navigation_config.actions.disable_all')
                                : t('navigation_config.actions.enable_all')}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {item.actions!.map((action) => {
                              const ActionIcon = getIconComponent(action.icon)
                              const isActionEnabled = enabledActionIds.has(action.id)
                              return (
                                <div
                                  key={action.id}
                                  className={cn(
                                    'flex items-center justify-between rounded-lg border p-2 transition-colors',
                                    isActionEnabled
                                      ? 'border-[var(--brand-200)] bg-white'
                                      : 'border-gray-200 bg-gray-100'
                                  )}
                                >
                                  <div className="flex min-w-0 flex-1 items-center gap-2">
                                    {ActionIcon && (
                                      <ActionIcon className="h-4 w-4 shrink-0 text-gray-500" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-xs font-medium text-gray-700">
                                        {locale === 'en'
                                          ? action.labelEn || action.label
                                          : locale === 'vi'
                                            ? action.labelVi || action.label
                                            : action.label}
                                      </div>
                                    </div>
                                  </div>
                                  <Switch
                                    checked={isActionEnabled}
                                    onCheckedChange={() => toggleAction(item.id, action.id)}
                                    disabled={!isEnabled}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <p className="text-xs text-gray-500">
              {t('navigation_config.selected_count', {
                selected: form.enabledItems.size,
                total: currentPayload.length,
              })}
              {form.customerId && (
                <span className="ml-2">
                  (
                  {customersData?.data?.find((c) => c.id === form.customerId)?.code === 'SYS'
                    ? t('navigation_config.navigation_type.admin')
                    : t('navigation_config.navigation_type.user')}
                  )
                </span>
              )}
            </p>
          </div>
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}
