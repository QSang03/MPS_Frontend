import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Copy, Plus, Trash2 } from 'lucide-react'
import type {
  Policy,
  PolicyBlueprint,
  PolicyDraftInput,
  SubjectAttributeFilter,
  ResourceFilterInput,
  PolicyConditionInput,
  ConditionGroupInput,
  DraftChecklistItem,
} from '@/types/policies'
import type { PolicyOperator } from '@/lib/api/services/policies-client.service'
import type { PolicyCondition } from '@/lib/api/services/policy-conditions-client.service'
import type { ResourceType } from '@/lib/api/services/resource-types-client.service'
import { stringifyPolicyPreview } from '@/lib/policies/policy-form.utils'
import type { PolicyFormCatalogs } from '../_types/policy-form'
import type { UserRole } from '@/types/users'

interface PolicyDraftPanelProps {
  draft: PolicyDraftInput
  onChange: (draft: PolicyDraftInput) => void
  roles: UserRole[]
  selectedRole?: string
  onSelectRole?: (role: string) => void
  blueprint?: PolicyBlueprint | null
  policyPreview: Partial<Policy>
  catalogs: PolicyFormCatalogs
  catalogsLoading?: boolean
  checklist: DraftChecklistItem[]
}

type SupportedDataType = SubjectAttributeFilter['dataType']

const SUBJECT_PRESETS: Array<{ label: string; field: string; dataType: SupportedDataType }> = [
  { label: 'role.level', field: 'role.level', dataType: 'number' },
  { label: 'user.customerId', field: 'user.customerId', dataType: 'string' },
  { label: 'user.departmentId', field: 'user.departmentId', dataType: 'string' },
  {
    label: 'user.attributes.managedCustomers',
    field: 'user.attributes.managedCustomers',
    dataType: 'array_string',
  },
]

const CUSTOMER_SCOPES: Array<{ key: PolicyDraftInput['customerScope']; label: string }> = [
  { key: 'all', label: 'Toàn hệ thống' },
  { key: 'self', label: 'user.customerId' },
  { key: 'managed', label: 'Managed customers' },
  { key: 'custom', label: 'Danh sách riêng' },
]

const CONDITION_GATES: Array<{ key: ConditionGroupInput['gate']; label: string }> = [
  { key: '$and', label: 'AND' },
  { key: '$or', label: 'OR' },
]

const ACTION_SUGGESTIONS = ['read', 'create', 'update', 'delete', '*']
const SUPPORTED_DATA_TYPES: SupportedDataType[] = [
  'string',
  'number',
  'boolean',
  'array_string',
  'datetime',
]
const RESOURCE_TENANT_WHITELIST = ['dashboard']

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const normalizeValueByType = (raw: string, dataType: SupportedDataType) => {
  if (dataType === 'number') {
    if (!raw.trim()) return undefined
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) return undefined
    return parsed
  }
  if (dataType === 'boolean') {
    if (raw !== 'true' && raw !== 'false') return undefined
    return raw === 'true'
  }
  if (dataType === 'array_string') {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  if (dataType === 'datetime') {
    return raw || undefined
  }
  return raw.trim()
}

const formatValueDisplay = (value: unknown) => {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value === null) return 'null'
  return typeof value === 'string' ? value : value !== undefined ? String(value) : ''
}

const mapSchemaTypeToSupported = (schemaType?: string): SupportedDataType => {
  if (!schemaType) return 'string'
  const normalized = schemaType.toLowerCase()
  if (normalized.includes('int') || normalized.includes('float') || normalized.includes('number'))
    return 'number'
  if (normalized.includes('bool')) return 'boolean'
  if (normalized.includes('array') || normalized.includes('list')) return 'array_string'
  if (normalized.includes('date') || normalized.includes('time')) return 'datetime'
  return 'string'
}

const findConditionMeta = (field: string, conditions: PolicyCondition[]) =>
  conditions.find((condition) => condition.name === field)

export function PolicyDraftPanel({
  draft,
  onChange,
  roles,
  selectedRole,
  onSelectRole,
  blueprint,
  policyPreview,
  catalogs,
  catalogsLoading = false,
  checklist,
}: PolicyDraftPanelProps) {
  const { policyOperators, resourceTypes, policyConditions } = catalogs
  const [actionInput, setActionInput] = useState('')

  const policyPreviewString = useMemo(() => stringifyPolicyPreview(policyPreview), [policyPreview])
  const availableOperators = policyOperators.length
    ? policyOperators
    : ([{ id: 'eq', name: '$eq' }] as PolicyOperator[])
  const defaultConditionGroup = useMemo<ConditionGroupInput>(
    () => ({
      id: generateId(),
      gate: '$and',
      conditions: [],
    }),
    []
  )

  const updateDraft = useCallback(
    (patch: Partial<PolicyDraftInput>) => {
      onChange({ ...draft, ...patch })
    },
    [draft, onChange]
  )

  useEffect(() => {
    let patched = false

    const normalizedSubjectAttributes = draft.subjectAttributes.some((attr) => !attr.id)
      ? draft.subjectAttributes.map((attr) => {
          if (attr.id) return attr
          patched = true
          return { ...attr, id: generateId() }
        })
      : draft.subjectAttributes

    const normalizedResourceFilters = draft.resourceFilters.some((filter) => !filter.id)
      ? draft.resourceFilters.map((filter) => {
          if (filter.id) return filter
          patched = true
          return { ...filter, id: generateId() }
        })
      : draft.resourceFilters

    const normalizedConditionGroups = draft.conditionGroups.map((group) => {
      let groupChanged = false
      const normalizedConditions = group.conditions.map((condition) => {
        if (condition.id) return condition
        patched = true
        groupChanged = true
        return { ...condition, id: generateId() }
      })
      return groupChanged ? { ...group, conditions: normalizedConditions } : group
    })

    if (patched) {
      updateDraft({
        subjectAttributes: normalizedSubjectAttributes,
        resourceFilters: normalizedResourceFilters,
        conditionGroups: normalizedConditionGroups,
      })
    }
  }, [draft.conditionGroups, draft.resourceFilters, draft.subjectAttributes, updateDraft])

  const handleAddAction = useCallback(() => {
    const next = actionInput.trim()
    if (!next) return
    if (draft.actions.includes(next)) {
      toast.info('Action đã tồn tại')
      return
    }
    updateDraft({ actions: [...draft.actions, next] })
    setActionInput('')
  }, [actionInput, draft.actions, updateDraft])

  const handleRemoveAction = useCallback(
    (action: string) => {
      updateDraft({ actions: draft.actions.filter((item) => item !== action) })
    },
    [draft.actions, updateDraft]
  )

  const handleChangeArrayValue = useCallback(
    (field: 'departmentValues' | 'managedCustomers' | 'customerIds', values: string[]) => {
      updateDraft({ [field]: values } as Partial<PolicyDraftInput>)
    },
    [updateDraft]
  )

  const handleSubjectAttributeChange = useCallback(
    (id: string, key: keyof SubjectAttributeFilter, value: unknown) => {
      const next = draft.subjectAttributes.map((attr) => {
        if (attr.id !== id) return attr
        if (key === 'value') {
          const normalized = normalizeValueByType(String(value ?? ''), attr.dataType)
          return { ...attr, value: normalized }
        }
        if (key === 'dataType') {
          return { ...attr, dataType: value as SupportedDataType, value: undefined }
        }
        return { ...attr, [key]: value }
      })
      updateDraft({ subjectAttributes: next })
    },
    [draft.subjectAttributes, updateDraft]
  )

  const handleAddSubjectAttribute = useCallback(() => {
    updateDraft({
      subjectAttributes: [
        ...draft.subjectAttributes,
        {
          id: generateId(),
          field: '',
          operator: '$eq',
          value: '',
          dataType: 'string',
        },
      ],
    })
  }, [draft.subjectAttributes, updateDraft])

  const handleRemoveSubjectAttribute = useCallback(
    (id: string) => {
      updateDraft({ subjectAttributes: draft.subjectAttributes.filter((attr) => attr.id !== id) })
    },
    [draft.subjectAttributes, updateDraft]
  )

  const handleResourceFilterChange = useCallback(
    (id: string, key: keyof ResourceFilterInput, value: unknown) => {
      const next = draft.resourceFilters.map((filter) => {
        if (filter.id !== id) return filter
        if (key === 'value') {
          const normalizedType = mapSchemaTypeToSupported(
            typeof filter.dataType === 'string' ? filter.dataType : undefined
          )
          return { ...filter, value: normalizeValueByType(String(value ?? ''), normalizedType) }
        }
        if (key === 'dataType') {
          return { ...filter, dataType: value as string, value: undefined }
        }
        return { ...filter, [key]: value }
      })
      updateDraft({ resourceFilters: next })
    },
    [draft.resourceFilters, updateDraft]
  )

  const handleAddResourceFilter = useCallback(() => {
    updateDraft({
      resourceFilters: [
        ...draft.resourceFilters,
        {
          id: generateId(),
          field: '',
          operator: '$eq',
          value: '',
          dataType: 'string',
          fromSchema: false,
        },
      ],
    })
  }, [draft.resourceFilters, updateDraft])

  const handleRemoveResourceFilter = useCallback(
    (id: string) => {
      updateDraft({ resourceFilters: draft.resourceFilters.filter((filter) => filter.id !== id) })
    },
    [draft.resourceFilters, updateDraft]
  )

  const handleConditionChange = useCallback(
    (
      groupId: string,
      conditionId: string | undefined,
      conditionIndex: number,
      key: keyof PolicyConditionInput,
      value: unknown
    ) => {
      const nextGroups = draft.conditionGroups.map((group) => {
        if (group.id !== groupId) return group
        const conditions = group.conditions.map((condition, idx) => {
          const matchedById = condition.id && condition.id === conditionId
          const matchedByIndex = !condition.id && idx === conditionIndex
          if (!matchedById && !matchedByIndex) return condition
          return { ...condition, [key]: value }
        })
        return { ...group, conditions }
      })
      updateDraft({ conditionGroups: nextGroups })
    },
    [draft.conditionGroups, updateDraft]
  )

  const handleAddCondition = useCallback(
    (groupId: string) => {
      const nextGroups = draft.conditionGroups.map((group) => {
        if (group.id !== groupId) return group
        return {
          ...group,
          conditions: [
            ...group.conditions,
            {
              id: generateId(),
              field: '',
              operator: '$eq',
              value: '',
            },
          ],
        }
      })
      updateDraft({ conditionGroups: nextGroups })
    },
    [draft.conditionGroups, updateDraft]
  )

  const handleRemoveCondition = useCallback(
    (groupId: string, conditionId: string | undefined, conditionIndex: number) => {
      const nextGroups = draft.conditionGroups.map((group) => {
        if (group.id !== groupId) return group
        return {
          ...group,
          conditions: group.conditions.filter((condition, idx) => {
            if (condition.id) return condition.id !== conditionId
            return idx !== conditionIndex
          }),
        }
      })
      updateDraft({ conditionGroups: nextGroups })
    },
    [draft.conditionGroups, updateDraft]
  )

  const handleAddConditionGroup = useCallback(() => {
    updateDraft({
      conditionGroups: [...draft.conditionGroups, { ...defaultConditionGroup, id: generateId() }],
    })
  }, [defaultConditionGroup, draft.conditionGroups, updateDraft])

  const handleRemoveConditionGroup = useCallback(
    (groupId: string) => {
      if (draft.conditionGroups.length === 1) {
        toast.error('Cần ít nhất một nhóm điều kiện')
        return
      }
      updateDraft({
        conditionGroups: draft.conditionGroups.filter((group) => group.id !== groupId),
      })
    },
    [draft.conditionGroups, updateDraft]
  )

  const handleCopyPreview = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(policyPreviewString)
      toast.success('Đã copy preview vào clipboard')
    } catch (error) {
      console.error('[PolicyDraftPanel] copy preview error', error)
      toast.error('Không thể copy JSON')
    }
  }, [policyPreviewString])

  return (
    <Card className="rounded-2xl border-2 border-slate-100 p-6 shadow-xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Draft Builder
          </p>
          <h2 className="text-2xl font-bold text-slate-900">Định nghĩa policy</h2>
          <p className="text-sm text-slate-500">
            Hoàn thiện metadata, subject, resource và environment conditions trước khi analyze.
          </p>
        </div>
        {blueprint?.recommendedGuardrails && blueprint.recommendedGuardrails.length > 0 ? (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-3 text-xs text-indigo-700">
            <p className="font-semibold text-indigo-900">Guardrail đề xuất</p>
            <p>{blueprint.recommendedGuardrails[0]}</p>
          </div>
        ) : null}
      </div>

      <Separator className="my-6" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase">
                  Thông tin chính
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Metadata</h3>
              </div>
              <Badge variant="outline" className="rounded-full text-xs">
                Role: {selectedRole || draft.selectedRole || '—'}
              </Badge>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="policy-name">Tên policy</Label>
                <Input
                  id="policy-name"
                  value={draft.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  placeholder="VD: DenyCrossCustomerAccess"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Effect</Label>
                <Select
                  value={draft.effect}
                  onValueChange={(value) =>
                    updateDraft({ effect: value as PolicyDraftInput['effect'] })
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Chọn effect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALLOW">ALLOW</SelectItem>
                    <SelectItem value="DENY">DENY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Actions</Label>
                <p className="text-xs text-slate-500">
                  Đề xuất: {ACTION_SUGGESTIONS.slice(0, 4).join(', ')}{' '}
                  <span className="text-slate-400">(+ custom)</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {draft.actions.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có action nào.</p>
                ) : (
                  draft.actions.map((action) => (
                    <Badge
                      key={action}
                      variant="secondary"
                      className="flex items-center gap-1 rounded-full"
                    >
                      {action}
                      <button
                        type="button"
                        onClick={() => handleRemoveAction(action)}
                        className="text-xs text-slate-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddAction()
                    }
                  }}
                  placeholder="Nhập action (vd: read)"
                  className="rounded-xl"
                />
                <Button type="button" onClick={handleAddAction} className="rounded-xl">
                  Thêm action
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ACTION_SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => {
                      if (draft.actions.includes(suggestion)) return
                      updateDraft({ actions: [...draft.actions, suggestion] })
                    }}
                  >
                    + {suggestion}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="policy-notes">Ghi chú (optional)</Label>
              <Textarea
                id="policy-notes"
                value={draft.notes}
                onChange={(e) => updateDraft({ notes: e.target.value })}
                rows={3}
                placeholder="Nhập mô tả/guardrail nội bộ"
                className="rounded-xl"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-sm">
            <Tabs defaultValue="subject" className="space-y-4">
              <TabsList className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1 text-xs font-semibold">
                <TabsTrigger value="subject">Subject</TabsTrigger>
                <TabsTrigger value="resource">Resource</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
              </TabsList>

              <TabsContent value="subject" className="space-y-5">
                <SubjectBuilder
                  draft={draft}
                  roles={roles}
                  policyOperators={availableOperators}
                  catalogLoading={catalogsLoading}
                  onSelectRole={onSelectRole}
                  onUpdateDraft={updateDraft}
                  onAttributesChange={handleSubjectAttributeChange}
                  onAddAttribute={handleAddSubjectAttribute}
                  onRemoveAttribute={handleRemoveSubjectAttribute}
                  onArrayValueChange={handleChangeArrayValue}
                />
              </TabsContent>

              <TabsContent value="resource" className="space-y-5">
                <ResourceBuilder
                  draft={draft}
                  resourceTypes={resourceTypes}
                  policyOperators={availableOperators}
                  onUpdateDraft={updateDraft}
                  onAddFilter={handleAddResourceFilter}
                  onFilterChange={handleResourceFilterChange}
                  onRemoveFilter={handleRemoveResourceFilter}
                />
              </TabsContent>

              <TabsContent value="conditions" className="space-y-5">
                <ConditionsBuilder
                  draft={draft}
                  policyConditions={policyConditions}
                  policyOperators={availableOperators}
                  onAddCondition={handleAddCondition}
                  onAddGroup={handleAddConditionGroup}
                  onConditionChange={handleConditionChange}
                  onGroupChange={(groupId, gate) => {
                    const nextGroups = draft.conditionGroups.map((group) =>
                      group.id === groupId ? { ...group, gate } : group
                    )
                    updateDraft({ conditionGroups: nextGroups })
                  }}
                  onRemoveCondition={handleRemoveCondition}
                  onRemoveGroup={handleRemoveConditionGroup}
                />
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                  Checklist
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Guardrail validation</h3>
              </div>
              <Badge variant="outline" className="rounded-full text-xs">
                {checklist.filter((item) => item.passed).length}/{checklist.length} done
              </Badge>
            </div>
            <div className="mt-4 space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
                    item.passed
                      ? 'border-emerald-100 bg-emerald-50/60 text-emerald-900'
                      : 'border-amber-100 bg-amber-50/60 text-amber-900'
                  }`}
                >
                  {item.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{item.label}</p>
                    {item.hint && <p className="text-xs opacity-80">{item.hint}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-slate-950 p-5 text-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                  Preview
                </p>
                <h3 className="text-lg font-semibold text-white">Policy JSON</h3>
              </div>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleCopyPreview}
                className="rounded-full bg-white/10"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="mt-4 max-h-[360px] overflow-auto rounded-xl bg-slate-900/70 p-4 text-xs leading-relaxed text-slate-100">
              {policyPreviewString || '{}'}
            </pre>
          </section>
        </aside>
      </div>
    </Card>
  )
}

interface SubjectBuilderProps {
  draft: PolicyDraftInput
  roles: UserRole[]
  policyOperators: PolicyOperator[]
  catalogLoading: boolean
  onSelectRole?: (role: string) => void
  onUpdateDraft: (patch: Partial<PolicyDraftInput>) => void
  onAttributesChange: (id: string, key: keyof SubjectAttributeFilter, value: unknown) => void
  onAddAttribute: () => void
  onRemoveAttribute: (id: string) => void
  onArrayValueChange: (
    field: 'departmentValues' | 'managedCustomers' | 'customerIds',
    values: string[]
  ) => void
}

function SubjectBuilder({
  draft,
  roles,
  policyOperators,
  catalogLoading,
  onSelectRole,
  onUpdateDraft,
  onAttributesChange,
  onAddAttribute,
  onRemoveAttribute,
  onArrayValueChange,
}: SubjectBuilderProps) {
  const handleApplyPreset = (preset: (typeof SUBJECT_PRESETS)[number]) => {
    if (draft.subjectAttributes.some((attr) => attr.field === preset.field)) return
    const next = [
      ...draft.subjectAttributes,
      {
        id: generateId(),
        field: preset.field,
        operator: '$eq',
        value: preset.dataType === 'array_string' ? [] : '',
        dataType: preset.dataType,
        readOnly: false,
      },
    ]
    onUpdateDraft({ subjectAttributes: next })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Role.name</Label>
            <Select
              value={draft.selectedRole}
              onValueChange={(value) => {
                onUpdateDraft({ selectedRole: value })
                onSelectRole?.(value)
              }}
              disabled={catalogLoading}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{role.name}</span>
                      <Badge variant="outline">Lv {role.level}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Customer scope</Label>
            <Select
              value={draft.customerScope}
              onValueChange={(value) =>
                onUpdateDraft({ customerScope: value as PolicyDraftInput['customerScope'] })
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn scope" />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_SCOPES.map((scope) => (
                  <SelectItem key={scope.key} value={scope.key}>
                    {scope.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Department scope</Label>
            <Select
              value={draft.departmentScope}
              onValueChange={(value) => {
                onUpdateDraft({
                  departmentScope: value as PolicyDraftInput['departmentScope'],
                  departmentValues: value === 'none' ? [] : draft.departmentValues,
                })
              }}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không lọc</SelectItem>
                <SelectItem value="name">Theo tên</SelectItem>
                <SelectItem value="code">Theo code</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm">
              Include managed customers
              <Switch
                checked={draft.includeManagedCustomers}
                onCheckedChange={(checked) =>
                  onUpdateDraft({
                    includeManagedCustomers: checked,
                    managedCustomers: checked ? draft.managedCustomers : [],
                  })
                }
              />
            </Label>
            <p className="text-xs text-slate-500">
              Cho phép sử dụng `user.attributes.managedCustomers` trong payload.
            </p>
          </div>
        </div>

        {draft.departmentScope !== 'none' ? (
          <MultiValueEditor
            label="Department values"
            values={draft.departmentValues}
            placeholder={draft.departmentScope === 'name' ? 'VD: Operations' : 'VD: OPS'}
            onChange={(values) => onArrayValueChange('departmentValues', values)}
          />
        ) : null}

        {draft.includeManagedCustomers ? (
          <MultiValueEditor
            label="Managed customer IDs"
            values={draft.managedCustomers}
            placeholder="VD: CUS-001"
            onChange={(values) => onArrayValueChange('managedCustomers', values)}
          />
        ) : null}

        {draft.customerScope === 'custom' ? (
          <MultiValueEditor
            label="Customer IDs"
            values={draft.customerIds}
            placeholder="VD: customer-123"
            onChange={(values) => onArrayValueChange('customerIds', values)}
          />
        ) : null}

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Preset nhanh
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUBJECT_PRESETS.map((preset) => (
              <Button
                key={preset.field}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => handleApplyPreset(preset)}
              >
                + {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Subject attributes</h4>
            <p className="text-xs text-slate-500">Thêm filters bổ sung cho subject.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full text-xs"
            onClick={onAddAttribute}
          >
            <Plus className="mr-1 h-3 w-3" /> Thêm field
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {draft.subjectAttributes.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có thuộc tính nào.</p>
          ) : (
            draft.subjectAttributes.map((attribute) => (
              <div
                key={attribute.id}
                className="grid gap-2 rounded-xl border border-slate-100 bg-white/60 p-3 md:grid-cols-[1.4fr_0.9fr_1fr_80px]"
              >
                <Input
                  value={attribute.field}
                  onChange={(e) => onAttributesChange(attribute.id, 'field', e.target.value)}
                  placeholder="VD: user.departmentId"
                  className="rounded-xl"
                />
                <Select
                  value={attribute.operator}
                  onValueChange={(value) => onAttributesChange(attribute.id, 'operator', value)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {policyOperators.map((operator) => (
                      <SelectItem key={operator.id} value={operator.name}>
                        {operator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={formatValueDisplay(attribute.value)}
                  onChange={(e) => onAttributesChange(attribute.id, 'value', e.target.value)}
                  placeholder="Value"
                  className="rounded-xl"
                />
                <div className="flex items-center gap-2">
                  <Select
                    value={attribute.dataType}
                    onValueChange={(value) => onAttributesChange(attribute.id, 'dataType', value)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_DATA_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-slate-500"
                    onClick={() => onRemoveAttribute(attribute.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface ResourceBuilderProps {
  draft: PolicyDraftInput
  resourceTypes: ResourceType[]
  policyOperators: PolicyOperator[]
  onUpdateDraft: (patch: Partial<PolicyDraftInput>) => void
  onAddFilter: () => void
  onFilterChange: (id: string, key: keyof ResourceFilterInput, value: unknown) => void
  onRemoveFilter: (id: string) => void
}

function ResourceBuilder({
  draft,
  resourceTypes,
  policyOperators,
  onUpdateDraft,
  onAddFilter,
  onFilterChange,
  onRemoveFilter,
}: ResourceBuilderProps) {
  const selectedResourceType = resourceTypes.find((type) => type.name === draft.resourceType)
  const schemaEntries = Object.entries(selectedResourceType?.attributeSchema || {})

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Resource type</h4>
            <p className="text-xs text-slate-500">Bắt buộc chọn type để map schema.</p>
          </div>
          <Badge variant="outline" className="rounded-full text-xs">
            Tenant whitelist: {RESOURCE_TENANT_WHITELIST.join(', ')}
          </Badge>
        </div>

        <Select
          value={draft.resourceType || ''}
          onValueChange={(value) =>
            onUpdateDraft({
              resourceType: value,
              resourceFilters: [],
            })
          }
        >
          <SelectTrigger className="mt-3 rounded-xl">
            <SelectValue placeholder="Chọn resource type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" disabled>
              Chọn resource type
            </SelectItem>
            {resourceTypes.map((type) => (
              <SelectItem key={type.id} value={type.name}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedResourceType ? (
          <div className="mt-4 rounded-xl border border-slate-100 bg-white/70 p-3">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
              Attribute schema
            </p>
            {schemaEntries.length ? (
              <div className="mt-2 space-y-2">
                {schemaEntries.slice(0, 6).map(([field, meta]) => (
                  <div
                    key={field}
                    className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-1.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{field}</p>
                      <p className="text-xs text-slate-500">{meta?.type || 'string'}</p>
                    </div>
                    <Badge variant="outline">
                      {meta?.type ? mapSchemaTypeToSupported(meta.type) : 'string'}
                    </Badge>
                  </div>
                ))}
                {schemaEntries.length > 6 ? (
                  <p className="text-right text-[11px] text-slate-400">
                    +{schemaEntries.length - 6} field khác
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Resource type này chưa có schema mô tả.</p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Chưa chọn resource type.</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Resource filters</h4>
            <p className="text-xs text-slate-500">
              Định nghĩa field/operator/value cho resource payload.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full text-xs"
            onClick={onAddFilter}
          >
            <Plus className="mr-1 h-3 w-3" /> Thêm filter
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {draft.resourceFilters.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có filter nào.</p>
          ) : (
            draft.resourceFilters.map((filter) => (
              <div
                key={filter.id}
                className="grid gap-2 rounded-xl border border-slate-100 bg-white/60 p-3 md:grid-cols-[1.4fr_0.9fr_1fr_80px]"
              >
                <Input
                  value={filter.field}
                  onChange={(e) => onFilterChange(filter.id, 'field', e.target.value)}
                  placeholder="VD: customerId"
                  className="rounded-xl"
                />
                <Select
                  value={filter.operator}
                  onValueChange={(value) => onFilterChange(filter.id, 'operator', value)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {policyOperators.map((operator) => (
                      <SelectItem key={operator.id} value={operator.name}>
                        {operator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={formatValueDisplay(filter.value)}
                  onChange={(e) => onFilterChange(filter.id, 'value', e.target.value)}
                  placeholder="Value"
                  className="rounded-xl"
                />
                <div className="flex items-center gap-2">
                  <Select
                    value={filter.dataType || 'string'}
                    onValueChange={(value) => onFilterChange(filter.id, 'dataType', value)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_DATA_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-slate-500"
                    onClick={() => onRemoveFilter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface ConditionsBuilderProps {
  draft: PolicyDraftInput
  policyConditions: PolicyCondition[]
  policyOperators: PolicyOperator[]
  onAddGroup: () => void
  onRemoveGroup: (groupId: string) => void
  onGroupChange: (groupId: string, gate: ConditionGroupInput['gate']) => void
  onAddCondition: (groupId: string) => void
  onRemoveCondition: (
    groupId: string,
    conditionId: string | undefined,
    conditionIndex: number
  ) => void
  onConditionChange: (
    groupId: string,
    conditionId: string | undefined,
    conditionIndex: number,
    key: keyof PolicyConditionInput,
    value: unknown
  ) => void
}

function ConditionsBuilder({
  draft,
  policyConditions,
  policyOperators,
  onAddGroup,
  onRemoveGroup,
  onGroupChange,
  onAddCondition,
  onRemoveCondition,
  onConditionChange,
}: ConditionsBuilderProps) {
  return (
    <div className="space-y-4">
      {draft.conditionGroups.map((group, index) => (
        <div key={group.id} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="rounded-full text-xs">
                Group {index + 1}
              </Badge>
              <Select
                value={group.gate}
                onValueChange={(value) =>
                  onGroupChange(group.id, value as ConditionGroupInput['gate'])
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Gate" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_GATES.map((gate) => (
                    <SelectItem key={gate.key} value={gate.key}>
                      {gate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-500"
              onClick={() => onRemoveGroup(group.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Xóa group
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {group.conditions.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có condition nào.</p>
            ) : (
              group.conditions.map((condition, conditionIndex) => {
                const meta = findConditionMeta(condition.field, policyConditions)
                return (
                  <div
                    key={condition.id}
                    className="grid gap-2 rounded-xl border border-slate-100 bg-white/60 p-3 md:grid-cols-[1.2fr_0.9fr_1fr_80px]"
                  >
                    <Select
                      value={condition.field}
                      onValueChange={(value) =>
                        onConditionChange(group.id, condition.id, conditionIndex, 'field', value)
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Chọn condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {policyConditions.map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) =>
                        onConditionChange(group.id, condition.id, conditionIndex, 'operator', value)
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {policyOperators.map((operator) => (
                          <SelectItem key={operator.id} value={operator.name}>
                            {operator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={formatValueDisplay(condition.value)}
                      onChange={(e) =>
                        onConditionChange(
                          group.id,
                          condition.id,
                          conditionIndex,
                          'value',
                          String(e.target.value)
                        )
                      }
                      placeholder="Value"
                      className="rounded-xl"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="w-full rounded-xl text-center text-[11px]"
                      >
                        {meta?.dataType || 'string'}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-slate-500"
                        onClick={() => onRemoveCondition(group.id, condition.id, conditionIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4 rounded-full text-xs"
            onClick={() => onAddCondition(group.id)}
          >
            <Plus className="mr-1 h-3 w-3" /> Thêm condition
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-2xl border-dashed"
        onClick={onAddGroup}
      >
        <Plus className="mr-2 h-4 w-4" /> Thêm group mới
      </Button>
    </div>
  )
}

interface MultiValueEditorProps {
  label: string
  values: string[]
  placeholder?: string
  onChange: (values: string[]) => void
}

function MultiValueEditor({ label, values, placeholder, onChange }: MultiValueEditorProps) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    const next = inputValue.trim()
    if (!next) return
    if (values.includes(next)) {
      setInputValue('')
      return
    }
    onChange([...values, next])
    setInputValue('')
  }

  const handleRemove = (value: string) => {
    onChange(values.filter((item) => item !== value))
  }

  return (
    <div className="mt-4 space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {values.length === 0 ? (
          <p className="text-sm text-slate-500">—</p>
        ) : (
          values.map((value) => (
            <Badge key={value} variant="secondary" className="flex items-center gap-1 rounded-full">
              {value}
              <button
                type="button"
                onClick={() => handleRemove(value)}
                className="text-xs text-slate-600"
              >
                ×
              </button>
            </Badge>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder={placeholder}
          className="rounded-xl"
        />
        <Button type="button" onClick={handleAdd} className="rounded-xl">
          Thêm
        </Button>
      </div>
    </div>
  )
}
