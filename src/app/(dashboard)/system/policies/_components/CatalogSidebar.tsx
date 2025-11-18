import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Info, Search, Database, Filter, Shield } from 'lucide-react'
import type { UserRole } from '@/types/users'
import type { ResourceType } from '@/lib/api/services/resource-types-client.service'
import type { PolicyOperator } from '@/lib/api/services/policies-client.service'
import type { PolicyCondition } from '@/lib/api/services/policy-conditions-client.service'

type CatalogTab = 'roles' | 'resources' | 'operators' | 'conditions'

interface CatalogSidebarProps {
  roles: UserRole[]
  resourceTypes: ResourceType[]
  policyOperators: PolicyOperator[]
  policyConditions: PolicyCondition[]
  loading?: boolean
}

const TAB_CONFIG: Record<
  CatalogTab,
  { label: string; icon: ComponentType<{ className?: string }> }
> = {
  roles: { label: 'Roles', icon: Shield },
  resources: { label: 'Resource Types', icon: Database },
  operators: { label: 'Policy Operators', icon: Filter },
  conditions: { label: 'Policy Conditions', icon: Info },
}

export function CatalogSidebar({
  roles,
  resourceTypes,
  policyOperators,
  policyConditions,
  loading = false,
}: CatalogSidebarProps) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<CatalogTab>('roles')
  const searchTerm = search.trim().toLowerCase()

  const searchPlaceholder = useMemo(() => {
    switch (tab) {
      case 'resources':
        return 'Tìm resource type...'
      case 'operators':
        return 'Tìm operator...'
      case 'conditions':
        return 'Tìm condition...'
      default:
        return 'Tìm role...'
    }
  }, [tab])

  const filteredRoles = useMemo(
    () =>
      roles.filter((role) => {
        if (!searchTerm) return true
        return role.name?.toLowerCase().includes(searchTerm)
      }),
    [roles, searchTerm]
  )

  const filteredResourceTypes = useMemo(
    () =>
      resourceTypes.filter((type) => {
        if (!searchTerm) return true
        const schemaFields = Object.keys(type.attributeSchema || {})
          .join(' ')
          .toLowerCase()
        return type.name.toLowerCase().includes(searchTerm) || schemaFields.includes(searchTerm)
      }),
    [resourceTypes, searchTerm]
  )

  const filteredOperators = useMemo(
    () =>
      policyOperators.filter((operator) => {
        if (!searchTerm) return true
        return (
          operator.name.toLowerCase().includes(searchTerm) ||
          (operator.appliesTo || []).some((scope) => scope.toLowerCase().includes(searchTerm))
        )
      }),
    [policyOperators, searchTerm]
  )

  const filteredConditions = useMemo(
    () =>
      policyConditions.filter((condition) => {
        if (!searchTerm) return true
        return (
          condition.name.toLowerCase().includes(searchTerm) ||
          (condition.dataType || '').toLowerCase().includes(searchTerm)
        )
      }),
    [policyConditions, searchTerm]
  )

  const renderRoles = () => (
    <div className="space-y-3">
      {filteredRoles.length === 0 ? (
        <p className="text-muted-foreground text-sm">Không tìm thấy role phù hợp.</p>
      ) : (
        filteredRoles.map((role) => (
          <div
            key={role.id ?? role.name}
            className="rounded-xl border border-slate-100 bg-white/80 p-3 text-sm shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{role.name}</p>
              {typeof role.level !== 'undefined' ? (
                <Badge variant="outline">Lv {role.level}</Badge>
              ) : null}
            </div>
            <p className="text-xs text-slate-500">
              {role.description || 'Role chuẩn từ backend. Dữ liệu đồng bộ trực tiếp.'}
            </p>
          </div>
        ))
      )}
    </div>
  )

  const renderResourceTypes = () => (
    <div className="space-y-3">
      {filteredResourceTypes.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa có resource type nào phù hợp.</p>
      ) : (
        filteredResourceTypes.map((type) => {
          const schemaEntries = Object.entries(type.attributeSchema || {})
          const extraFields = Math.max(schemaEntries.length - 3, 0)
          return (
            <div
              key={type.id}
              className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 text-sm shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-900">{type.name}</p>
                  {type.description ? (
                    <p className="text-xs text-blue-700">{type.description}</p>
                  ) : (
                    <p className="text-xs text-blue-600">Attribute schema từ backend</p>
                  )}
                </div>
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  {schemaEntries.length || 0} fields
                </Badge>
              </div>
              {schemaEntries.length ? (
                <div className="mt-2 space-y-1 rounded-lg bg-white/70 p-2 text-xs text-slate-600">
                  {schemaEntries.slice(0, 3).map(([field, meta]) => (
                    <div key={field} className="flex items-center justify-between gap-2">
                      <span className="font-medium">{field}</span>
                      <span className="text-slate-500">{meta?.type || 'any'}</span>
                    </div>
                  ))}
                  {extraFields > 0 ? (
                    <p className="text-right text-[11px] text-slate-400">
                      +{extraFields} trường khác
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })
      )}
    </div>
  )

  const renderOperators = () => (
    <div className="space-y-3">
      {filteredOperators.length === 0 ? (
        <p className="text-muted-foreground text-sm">Không có operator nào phù hợp.</p>
      ) : (
        filteredOperators.map((operator) => (
          <div
            key={operator.id}
            className="rounded-xl border border-emerald-100 bg-white/80 p-3 text-sm shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-emerald-900">{operator.name}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-emerald-500 hover:text-emerald-700">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  {operator.description || 'Operator chuẩn hoá từ PolicyOperatorService.'}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(operator.appliesTo || ['generic']).map((scope) => (
                <Badge
                  key={`${operator.id}-${scope}`}
                  variant="secondary"
                  className="text-xs capitalize"
                >
                  {scope}
                </Badge>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderConditions = () => (
    <div className="space-y-3">
      {filteredConditions.length === 0 ? (
        <p className="text-muted-foreground text-sm">Không có condition nào phù hợp.</p>
      ) : (
        filteredConditions.map((condition) => (
          <div
            key={condition.id}
            className="rounded-xl border border-purple-100 bg-white/80 p-3 text-sm shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-purple-900">{condition.name}</p>
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                {condition.dataType || 'unknown'}
              </Badge>
            </div>
            <p className="text-xs text-purple-600">
              {condition.description || 'Condition environment do backend quản lý.'}
            </p>
          </div>
        ))
      )}
    </div>
  )

  const contentByTab: Record<CatalogTab, ReactNode> = {
    roles: renderRoles(),
    resources: renderResourceTypes(),
    operators: renderOperators(),
    conditions: renderConditions(),
  }

  return (
    <Card className="h-full rounded-2xl border-2 border-slate-100 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Catalog</p>
          <h2 className="text-lg font-bold text-slate-900">Dữ liệu chuẩn hoá</h2>
        </div>
        <Badge variant="outline" className="text-[11px]">
          Live
        </Badge>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Đọc trực tiếp từ backend: roles, resource types, operators, conditions.
      </p>

      <Separator className="my-4" />

      <div className="relative">
        <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 text-sm"
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(val) => setTab(val as CatalogTab)}
        className="mt-4 flex h-full flex-col"
      >
        <TabsList className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          {Object.entries(TAB_CONFIG).map(([key, config]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="flex items-center gap-1 rounded-xl text-xs font-semibold"
            >
              <config.icon className="h-3.5 w-3.5" />
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4 flex-1 overflow-hidden">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={`catalog-skeleton-${idx}`} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            Object.entries(contentByTab).map(([key, content]) => (
              <TabsContent
                key={key}
                value={key}
                className="mt-0 h-full overflow-y-auto pr-1 pb-2 [&>div]:h-fit"
              >
                {content}
              </TabsContent>
            ))
          )}
        </div>
      </Tabs>
    </Card>
  )
}
