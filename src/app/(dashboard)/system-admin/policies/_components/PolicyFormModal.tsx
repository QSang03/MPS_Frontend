'use client'

import { useEffect, useState, useMemo } from 'react'
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
import { useQuery } from '@tanstack/react-query'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'
import { policiesClientService } from '@/lib/api/services/policies-client.service'
import { policyConditionsClientService } from '@/lib/api/services/policy-conditions-client.service'
// Select component imports removed - not used in this file
import { Checkbox } from '@/components/ui/checkbox'

const policySchema = z.object({
  name: z.string().min(1, 'Tên policy là bắt buộc'),
  effect: z.string().min(1),
  actions: z.string().optional(),
  includeRole: z.boolean().optional(),
  roleMatchBy: z.enum(['name', 'level']).optional(),
  roleOperator: z.string().optional(),
  roleValues: z.array(z.string()).optional(),
  roleUseList: z.boolean().optional(),
  roleNameManual: z.string().optional(),
  roleNameFromList: z.string().optional(),
  roleLevel: z.union([z.string(), z.number()]).optional(),
  resourceOperator: z.string().optional(),
  resourceTypeFromList: z.string().optional(),
  includeDepartment: z.boolean().optional(),
  deptMatchBy: z.enum(['name', 'code']).optional(),
  deptOperator: z.string().optional(),
  deptValues: z.array(z.string()).optional(),
  deptUseList: z.boolean().optional(),
  deptNameManual: z.string().optional(),
  deptNameFromList: z.string().optional(),
  deptCodeFromList: z.string().optional(),
  conditions: z.string().optional(), // JSON
})

type PolicyFormData = z.infer<typeof policySchema>

interface PolicyFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Policy>) => Promise<void>
  initialData?: Partial<Policy> | null
  viewOnly?: boolean
  onRequestEdit?: () => void
}

export function PolicyFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  viewOnly,
  onRequestEdit,
}: PolicyFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  // local view-only state to allow immediate switch to edit inside modal
  const [localViewOnly, setLocalViewOnly] = useState<boolean>(!!viewOnly)

  useEffect(() => {
    setLocalViewOnly(!!viewOnly)
  }, [viewOnly])

  const initialFormDefaults: PolicyFormData = {
    name: '',
    effect: 'ALLOW',
    actions: '',
    includeRole: false,
    roleMatchBy: 'name',
    roleOperator: '$eq',
    roleUseList: true,
    roleNameManual: '',
    roleNameFromList: '',
    roleLevel: '',
    roleValues: [],
    includeDepartment: false,
    deptMatchBy: 'name',
    deptOperator: '$eq',
    deptUseList: true,
    deptNameManual: '',
    deptNameFromList: '',
    deptCodeFromList: '',
    deptValues: [],
    conditions: '',
    resourceOperator: '$eq',
    resourceTypeFromList: '',
  }

  const form = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: initialFormDefaults,
  })

  // fetch lists
  const { data: rolesResp } = useQuery({
    queryKey: ['roles', 'for-policy'],
    queryFn: async () => (await rolesClientService.getRoles({ page: 1, limit: 1000 })).data,
    staleTime: 1000 * 60 * 5,
  })

  const { data: deptsResp } = useQuery({
    queryKey: ['departments', 'for-policy'],
    queryFn: async () =>
      (await departmentsClientService.getDepartments({ page: 1, limit: 1000 })).data,
    staleTime: 1000 * 60 * 5,
  })

  const { data: operatorsResp } = useQuery({
    queryKey: ['policy-operators'],
    queryFn: () => policiesClientService.getPolicyOperators(),
    staleTime: 1000 * 60 * 10,
  })

  const roleMatchBy = form.watch('roleMatchBy')
  const deptMatchBy = form.watch('deptMatchBy')
  const roleValuesWatch = form.watch('roleValues') || []
  const deptValuesWatch = form.watch('deptValues') || []

  // local temporary inputs for multi-value manual entry so we can disable selects while user types
  const [roleArrayInput, setRoleArrayInput] = useState('')
  const [roleLevelInput, setRoleLevelInput] = useState('')
  const [deptArrayInput, setDeptArrayInput] = useState('')
  // keep separate lists so UI can render tags from list vs manual separately
  const [roleValuesFromList, setRoleValuesFromList] = useState<string[]>([])
  const [roleValuesManual, setRoleValuesManual] = useState<string[]>([])
  const [deptValuesFromList, setDeptValuesFromList] = useState<string[]>([])
  const [deptValuesManual, setDeptValuesManual] = useState<string[]>([])

  // classify current form values into from-list vs manual by comparing against available options (case-insensitive)
  useEffect(() => {
    const arraysEqual = (a: string[], b: string[]) => {
      if (a === b) return true
      if (!a || !b) return false
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
      return true
    }
    // roles
    const roleNames = (rolesResp || []).map((r: any) => String(r.name || '').toLowerCase())
    const fromList: string[] = []
    const manual: string[] = []
    ;(roleValuesWatch || []).forEach((v: string) => {
      const s = String(v || '')
      if (s === '') return
      if (roleNames.includes(s.toLowerCase())) fromList.push(s)
      else manual.push(s)
    })
    const nextRoleFrom = Array.from(new Set(fromList))
    const nextRoleManual = Array.from(new Set(manual))
    if (!arraysEqual(nextRoleFrom, roleValuesFromList)) setRoleValuesFromList(nextRoleFrom)
    if (!arraysEqual(nextRoleManual, roleValuesManual)) setRoleValuesManual(nextRoleManual)

    // departments: choose comparison field based on deptMatchBy
    const deptNames = (deptsResp || []).map((d: any) => String(d.name || '').toLowerCase())
    const deptCodes = (deptsResp || []).map((d: any) => String(d.code || '').toLowerCase())
    const dFromList: string[] = []
    const dManual: string[] = []
    ;(deptValuesWatch || []).forEach((v: string) => {
      const s = String(v || '')
      if (s === '') return
      if (deptMatchBy === 'code') {
        if (deptCodes.includes(s.toLowerCase())) dFromList.push(s)
        else dManual.push(s)
      } else {
        if (deptNames.includes(s.toLowerCase())) dFromList.push(s)
        else dManual.push(s)
      }
    })
    const nextDeptFrom = Array.from(new Set(dFromList))
    const nextDeptManual = Array.from(new Set(dManual))
    if (!arraysEqual(nextDeptFrom, deptValuesFromList)) setDeptValuesFromList(nextDeptFrom)
    if (!arraysEqual(nextDeptManual, deptValuesManual)) setDeptValuesManual(nextDeptManual)
  }, [rolesResp, deptsResp, roleValuesWatch, deptValuesWatch, deptMatchBy])

  const { data: roleOperators } = useQuery({
    queryKey: ['policy-operators', 'role', roleMatchBy],
    queryFn: () => {
      const appliesTo = roleMatchBy === 'name' ? 'string' : 'number'
      return policiesClientService.getPolicyOperators(appliesTo)
    },
    enabled: !!roleMatchBy,
    staleTime: 1000 * 60 * 10,
  })

  const { data: deptOperators } = useQuery({
    queryKey: ['policy-operators', 'dept', deptMatchBy],
    queryFn: () => {
      // departments use string for both name and code
      return policiesClientService.getPolicyOperators('string')
    },
    enabled: !!deptMatchBy,
    staleTime: 1000 * 60 * 10,
  })

  // DEBUG: temporarily log operators to verify backend vs frontend count
  useEffect(() => {
    if (operatorsResp) {
      console.debug(
        '[debug] operatorsResp count',
        operatorsResp.length,
        operatorsResp.map((o) => o.name)
      )
    }
  }, [operatorsResp])

  // resource types
  const {
    data: resourceTypesResp,
    error: resourceTypesError,
    isLoading: resourceTypesLoading,
    refetch: refetchResourceTypes,
  } = useQuery<any[], Error>({
    queryKey: ['resource-types'],
    queryFn: () => policiesClientService.getResourceTypes({ limit: 100 }),
    staleTime: 1000 * 60 * 10,
  })

  // normalize resource types response (some services return { data: [] } while others return [] )
  const resourceTypes = useMemo(() => {
    if (!resourceTypesResp) return [] as any[]
    if (Array.isArray(resourceTypesResp)) return resourceTypesResp
    // if server returned an object like { data: [...] }
    if (resourceTypesResp && typeof resourceTypesResp === 'object' && 'data' in resourceTypesResp)
      return (resourceTypesResp as any).data || []
    return []
  }, [resourceTypesResp])

  // When the modal opens, ensure resource types are fetched/refreshed
  useEffect(() => {
    if (isOpen) {
      // attempt a fresh fetch and log result for debugging
      refetchResourceTypes()
        .then((res) => {
          console.debug('[PolicyFormModal] refetchResourceTypes result', res)
        })
        .catch((err) => {
          console.error('[PolicyFormModal] refetchResourceTypes error', err)
        })
    }
  }, [isOpen, refetchResourceTypes])

  // Defensive: when the dialog opens, ensure local view-only state mirrors prop
  // (fixes cases where the modal remained non-interactive after being left idle)
  useEffect(() => {
    if (isOpen) {
      setLocalViewOnly(!!viewOnly)
      // small focus/tick to ensure interactive elements are enabled in the next paint
      setTimeout(() => {
        try {
          if (typeof form.setFocus === 'function') form.setFocus('name')
        } catch {}
      }, 0)
    }
  }, [isOpen, viewOnly, form])

  useEffect(() => {
    if (resourceTypesResp) {
      console.debug('[PolicyFormModal] resourceTypesResp updated', resourceTypesResp)
    }
    if (resourceTypesError) {
      console.error('[PolicyFormModal] resourceTypesError', resourceTypesError)
    }
  }, [resourceTypesResp, resourceTypesError])

  const formatOperatorLabel = (op: { name: string; description?: string }) => {
    if (!op) return ''
    return op.description ? `${op.name} — ${op.description}` : op.name
  }

  const getOperatorByName = (name?: string) => {
    if (!name) return null
    // prefer operators from the filtered queries (role/dept) to match what's shown in the select
    const fromRole = (roleOperators || []).find((op) => op.name === name)
    if (fromRole) return fromRole
    const fromDept = (deptOperators || []).find((op) => op.name === name)
    if (fromDept) return fromDept
    if (!operatorsResp) return null
    return operatorsResp.find((op) => op.name === name)
  }

  // When operator or matchBy changes, clear manual inputs that are no longer relevant
  useEffect(() => {
    const op = getOperatorByName(form.getValues('roleOperator'))
    const applies = op?.appliesTo || []
    const isArray = isArrayApplies(applies)

    if (isArray) {
      // operator now expects arrays — clear single manual inputs so list/select remains enabled when appropriate
      if (form.getValues('roleNameManual')) form.setValue('roleNameManual', '')
      if (form.getValues('roleLevel')) form.setValue('roleLevel', '')
    } else {
      // operator expects single — clear array/manual lists so they don't block single selects
      if (roleArrayInput) setRoleArrayInput('')
      if ((roleValuesManual || []).length > 0) {
        setRoleValuesManual([])
        // restore any list-sourced values into the form if present
        form.setValue('roleValues', roleValuesFromList || [])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('roleOperator'), form.watch('roleMatchBy')])

  useEffect(() => {
    const op = getOperatorByName(form.getValues('deptOperator'))
    const applies = op?.appliesTo || []
    const isArray = isArrayApplies(applies)

    if (isArray) {
      if (form.getValues('deptNameManual')) form.setValue('deptNameManual', '')
    } else {
      if (deptArrayInput) setDeptArrayInput('')
      if ((deptValuesManual || []).length > 0) {
        setDeptValuesManual([])
        form.setValue('deptValues', deptValuesFromList || [])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('deptOperator'), form.watch('deptMatchBy')])

  const isArrayApplies = (applies: string[] | undefined) => {
    if (!applies || !applies.length) return false
    return applies.some((a) => a.startsWith('array'))
  }

  const filterOperatorsByType = (dataType: 'string' | 'number') => {
    if (!operatorsResp) return []
    if (dataType === 'string') {
      // String type can use both string and array operators
      return operatorsResp.filter(
        (op) => op.appliesTo?.includes('string') || op.appliesTo?.includes('array_string')
      )
    }
    // Number type can use both number and array_number operators
    return operatorsResp.filter(
      (op) => op.appliesTo?.includes('number') || op.appliesTo?.includes('array_number')
    )
  }

  // policy conditions (discovery)
  const {
    data: conditionsResp,
    isLoading: conditionsLoading,
    error: conditionsError,
    refetch: refetchConditions,
  } = useQuery({
    queryKey: ['policy-conditions'],
    queryFn: () => policyConditionsClientService.getPolicyConditions({ limit: 200 }),
    staleTime: 1000 * 60 * 10,
  })

  // local state to track selected conditions and their operator/value
  const [selectedConditions, setSelectedConditions] = useState<
    Record<string, { operator?: string; value?: string }>
  >({})
  // per-condition validation errors (e.g. invalid IP format)
  const [conditionErrors, setConditionErrors] = useState<Record<string, string | null>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const toggleCondition = (id: string) => {
    setSelectedConditions((s) => {
      const copy = { ...s }
      if (id in copy) delete copy[id]
      else copy[id] = { operator: '$eq', value: '' }
      return copy
    })
  }

  const setConditionOperator = (id: string, op: string) => {
    setSelectedConditions((s) => ({ ...s, [id]: { ...(s[id] || {}), operator: op } }))
  }

  const setConditionValue = (id: string, val: string) => {
    // validate while setting: for IP-specific conditions, allow multiple IPs and both IPv4/IPv6
    const cond = (conditionsResp || []).find((c: any) => c.id === id)
    if (cond && cond.name === 'ipAddress') {
      const raw = String(val || '')
      // split by comma or whitespace, allow entries separated by commas
      const parts = raw
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)

      if (parts.length === 0) {
        setConditionErrors((s) => ({ ...s, [id]: null }))
      } else {
        // IPv4 regex
        const ipv4 =
          /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/
        // IPv6 (simple) regex - accepts common IPv6 forms (not exhaustive but practical)
        const ipv6 = /^([0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}$/
        const invalid = parts.find((p) => !(ipv4.test(p) || ipv6.test(p)))
        if (invalid) {
          setConditionErrors((s) => ({
            ...s,
            [id]: 'Một hoặc nhiều IP không hợp lệ. Nhập IPv4 hoặc IPv6, cách nhau bằng dấu phẩy',
          }))
        } else {
          setConditionErrors((s) => ({ ...s, [id]: null }))
        }
      }
    }

    setSelectedConditions((s) => ({ ...s, [id]: { ...(s[id] || {}), value: val } }))
  }

  const addArrayValue = (
    fieldName: 'roleValues' | 'deptValues',
    value: string,
    source?: 'list' | 'manual'
  ) => {
    if (!value) return
    const cur: string[] = form.getValues(fieldName) || []
    if (cur.includes(value)) return

    if (source === 'manual') {
      // build new manual-only list and clear list-sourced values
      if (fieldName === 'roleValues') {
        const nextManual = Array.from(new Set([...(roleValuesManual || []), value]))
        setRoleValuesManual(nextManual)
        setRoleValuesFromList([])
        form.setValue(fieldName, nextManual)
      }
      if (fieldName === 'deptValues') {
        const nextManual = Array.from(new Set([...(deptValuesManual || []), value]))
        setDeptValuesManual(nextManual)
        setDeptValuesFromList([])
        form.setValue(fieldName, nextManual)
      }
      return
    }

    // source is list (default) — append to existing form values and update fromList
    const next = [...cur, value]
    form.setValue(fieldName, next)
    if (fieldName === 'roleValues') {
      setRoleValuesFromList((s) => Array.from(new Set([...s, value])))
    }
    if (fieldName === 'deptValues') {
      setDeptValuesFromList((s) => Array.from(new Set([...s, value])))
    }
  }

  const removeArrayValue = (fieldName: 'roleValues' | 'deptValues', value: string) => {
    const cur: string[] = form.getValues(fieldName) || []
    const next = cur.filter((v) => v !== value)
    form.setValue(fieldName, next)
    if (fieldName === 'roleValues') {
      setRoleValuesFromList((s) => s.filter((v) => v !== value))
      setRoleValuesManual((s) => s.filter((v) => v !== value))
    }
    if (fieldName === 'deptValues') {
      setDeptValuesFromList((s) => s.filter((v) => v !== value))
      setDeptValuesManual((s) => s.filter((v) => v !== value))
    }
  }

  // Ensure default subfield values when includeRole/includeDepartment toggled on
  const includeRoleWatch = form.watch('includeRole')
  const includeDepartmentWatch = form.watch('includeDepartment')

  useEffect(() => {
    if (includeRoleWatch) {
      // ensure role subfields have defaults so UI shows correctly
      if (!form.getValues('roleMatchBy')) form.setValue('roleMatchBy', 'name')
      if (!form.getValues('roleOperator')) form.setValue('roleOperator', '$eq')
      if (typeof form.getValues('roleUseList') === 'undefined') form.setValue('roleUseList', true)
      if (typeof form.getValues('roleNameFromList') === 'undefined')
        form.setValue('roleNameFromList', '')
      if (typeof form.getValues('roleNameManual') === 'undefined')
        form.setValue('roleNameManual', '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeRoleWatch])

  useEffect(() => {
    if (includeDepartmentWatch) {
      // ensure department subfields have defaults so UI shows correctly
      if (!form.getValues('deptMatchBy')) form.setValue('deptMatchBy', 'name')
      if (!form.getValues('deptOperator')) form.setValue('deptOperator', '$eq')
      if (typeof form.getValues('deptUseList') === 'undefined') form.setValue('deptUseList', true)
      if (typeof form.getValues('deptNameFromList') === 'undefined')
        form.setValue('deptNameFromList', '')
      if (typeof form.getValues('deptNameManual') === 'undefined')
        form.setValue('deptNameManual', '')
      if (typeof form.getValues('deptCodeFromList') === 'undefined')
        form.setValue('deptCodeFromList', '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeDepartmentWatch])

  useEffect(() => {
    if (initialData) {
      // Map existing subject object into structured fields when possible
      const subj = (initialData.subject as Record<string, unknown>) || {}
      const includeRole = Object.keys(subj).some((k) => k.includes('role'))
      const includeDepartment = Object.keys(subj).some(
        (k) => k.includes('department') || k.includes('attributes.department')
      )

      const values: Partial<PolicyFormData> = {
        name: initialData.name || '',
        effect: initialData.effect || 'ALLOW',
        actions: (initialData.actions || []).join(', '),
        includeRole,
        includeDepartment,
        conditions: initialData.conditions ? JSON.stringify(initialData.conditions, null, 2) : '',
      }

      // resource parsing: if structured like { type: { $eq: 'report' } } then pre-fill operator + selection
      if (initialData.resource) {
        try {
          const r = initialData.resource as any
          if (r && typeof r === 'object' && 'type' in r) {
            const t = r.type
            if (t && typeof t === 'object') {
              const detectedOp = Object.keys(t).find((k) => String(k).startsWith('$'))
              if (detectedOp) {
                values.resourceOperator = detectedOp
                const val = t[detectedOp]
                if (typeof val === 'string' || typeof val === 'number')
                  values.resourceTypeFromList = String(val)
                else values.resourceTypeFromList = JSON.stringify(val)
              }
            } else if (typeof t === 'string' || typeof t === 'number') {
              // no explicit operator present; default to $eq
              values.resourceOperator = values.resourceOperator || '$eq'
              values.resourceTypeFromList = String(t)
            }
          }
        } catch {
          // ignore parsing errors and leave defaults
        }
      }

      // role parsing
      if (includeRole) {
        if (subj['role.name']) {
          values.roleMatchBy = 'name'
          const roleNameObj = subj['role.name']
          // Detect operator: check keys like $eq, $ne, $in, etc.
          const detectedOp =
            typeof roleNameObj === 'object' && roleNameObj !== null
              ? Object.keys(roleNameObj as object).find((k) => k.startsWith('$'))
              : undefined
          values.roleOperator = detectedOp || '$eq'
          const val =
            detectedOp && (roleNameObj as any)[detectedOp]
              ? (roleNameObj as any)[detectedOp]
              : roleNameObj
          if (Array.isArray(val)) {
            values.roleValues = val.map((v: any) => String(v))
            values.roleUseList = false
          } else {
            values.roleNameManual = typeof val === 'string' ? String(val) : ''
            values.roleUseList = true
            values.roleNameFromList = typeof val === 'string' ? String(val) : ''
          }
        } else if (subj['role.level']) {
          values.roleMatchBy = 'level'
          const roleLevelObj = subj['role.level']
          const detectedOp =
            typeof roleLevelObj === 'object' && roleLevelObj !== null
              ? Object.keys(roleLevelObj as object).find((k) => k.startsWith('$'))
              : undefined
          values.roleOperator = detectedOp || '$eq'
          const val =
            detectedOp && (roleLevelObj as any)[detectedOp]
              ? (roleLevelObj as any)[detectedOp]
              : roleLevelObj
          values.roleLevel = typeof val === 'number' ? String(val) : String(val)
        }
      }

      // department parsing
      if (includeDepartment) {
        // prefer attributes.department shape used by backend (attributes.department: { $eq: 'tech' })
        const deptNameKey = subj['attributes.department']
          ? 'attributes.department'
          : subj['department.name']
            ? 'department.name'
            : undefined
        if (deptNameKey) {
          values.deptMatchBy = 'name'
          const deptNameObj = subj[deptNameKey]
          const detectedOp =
            typeof deptNameObj === 'object' && deptNameObj !== null
              ? Object.keys(deptNameObj as object).find((k) => k.startsWith('$'))
              : undefined
          values.deptOperator = detectedOp || '$eq'
          const val =
            detectedOp && (deptNameObj as any)[detectedOp]
              ? (deptNameObj as any)[detectedOp]
              : deptNameObj
          if (Array.isArray(val)) {
            values.deptValues = val.map((v: any) => String(v))
            values.deptUseList = false
          } else {
            values.deptNameManual = typeof val === 'string' ? String(val) : ''
            values.deptUseList = true
            values.deptNameFromList = typeof val === 'string' ? String(val) : ''
          }
        } else if (subj['department.code']) {
          values.deptMatchBy = 'code'
          const deptCodeObj = subj['department.code']
          const detectedOp =
            typeof deptCodeObj === 'object' && deptCodeObj !== null
              ? Object.keys(deptCodeObj as object).find((k) => k.startsWith('$'))
              : undefined
          values.deptOperator = detectedOp || '$eq'
          const val =
            detectedOp && (deptCodeObj as any)[detectedOp]
              ? (deptCodeObj as any)[detectedOp]
              : deptCodeObj
          values.deptCodeFromList = typeof val === 'string' ? String(val) : ''
        }
      }

      form.reset(values as any)
    } else {
      // switching to "create" mode — reset to defaults and clear local UI state
      form.reset(initialFormDefaults as any)
      setSelectedConditions({})
      setConditionErrors({})
      setRoleArrayInput('')
      setRoleLevelInput('')
      setDeptArrayInput('')
      setRoleValuesFromList([])
      setRoleValuesManual([])
      setDeptValuesFromList([])
      setDeptValuesManual([])
      // ensure local view-only mirrors prop (usually false for create)
      setLocalViewOnly(!!viewOnly)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, rolesResp, deptsResp])

  const handleSubmit = async (data: PolicyFormData) => {
    setIsLoading(true)
    // prevent submit when validation errors exist
    const firstErr = Object.values(conditionErrors || {}).find((e) => !!e)
    if (firstErr) {
      setSubmitError('Vui lòng sửa lỗi trong điều kiện trước khi lưu')
      setIsLoading(false)
      return
    }
    try {
      const parsed: Partial<Policy> = {
        name: data.name,
        effect: data.effect,
        actions: data.actions ? data.actions.split(',').map((s) => s.trim()) : [],
      }

      // Build subject from structured fields
      const subjectObj: Record<string, unknown> = {}
      if (data.includeRole) {
        const operator = data.roleOperator || '$eq'
        const opMeta = getOperatorByName(operator)
        const applies = opMeta?.appliesTo || []

        if (data.roleMatchBy === 'name') {
          if (isArrayApplies(applies)) {
            // prefer manual-sourced tags when available, otherwise use list-sourced tags
            const manualVals = roleValuesManual || []
            const listVals = roleValuesFromList || []
            const fallback = data.roleValues || []
            const chosenVals =
              manualVals.length > 0 ? manualVals : listVals.length > 0 ? listVals : fallback
            if (chosenVals.length) subjectObj['role.name'] = { [operator]: chosenVals }
          } else if (applies.includes('number')) {
            // prefer manual input when provided, otherwise use selected list value
            const manual = (data.roleNameManual || '').toString().trim()
            const list = (data.roleNameFromList || '').toString().trim()
            const chosen = manual.length > 0 ? manual : list.length > 0 ? list : undefined
            if (typeof chosen !== 'undefined' && chosen !== '')
              subjectObj['role.name'] = { [operator]: Number(chosen) }
          } else {
            // prefer manual input when provided, otherwise use selected list value
            const manual = (data.roleNameManual || '').toString().trim()
            const list = (data.roleNameFromList || '').toString().trim()
            const chosen = manual.length > 0 ? manual : list.length > 0 ? list : undefined
            if (typeof chosen !== 'undefined' && chosen !== '')
              subjectObj['role.name'] = { [operator]: chosen }
          }
        } else if (data.roleMatchBy === 'level') {
          if (isArrayApplies(applies)) {
            // prefer manual-sourced tags when available, otherwise use list-sourced tags
            const manualVals = roleValuesManual || []
            const listVals = roleValuesFromList || []
            const fallback = data.roleValues || []
            const chosen =
              manualVals.length > 0 ? manualVals : listVals.length > 0 ? listVals : fallback
            const vals = (chosen || []).map((v) => Number(v))
            if (vals.length) subjectObj['role.level'] = { [operator]: vals }
          } else {
            if (typeof data.roleLevel !== 'undefined' && data.roleLevel !== '')
              subjectObj['role.level'] = { [operator]: Number(data.roleLevel) }
          }
        }
      }

      if (data.includeDepartment) {
        const operator = data.deptOperator || '$eq'
        const opMeta = getOperatorByName(operator)
        const applies = opMeta?.appliesTo || []

        if (data.deptMatchBy === 'name') {
          if (isArrayApplies(applies)) {
            // prefer manual-sourced tags when available, otherwise use list-sourced tags
            const manualVals = deptValuesManual || []
            const listVals = deptValuesFromList || []
            const fallback = data.deptValues || []
            const chosenVals =
              manualVals.length > 0 ? manualVals : listVals.length > 0 ? listVals : fallback
            if (chosenVals.length) subjectObj['department.name'] = { [operator]: chosenVals }
          } else if (applies.includes('number')) {
            // prefer manual input when provided, otherwise use selected list value
            const manual = (data.deptNameManual || '').toString().trim()
            const list = (data.deptNameFromList || '').toString().trim()
            const chosen = manual.length > 0 ? manual : list.length > 0 ? list : undefined
            if (typeof chosen !== 'undefined' && chosen !== '')
              subjectObj['department.name'] = { [operator]: Number(chosen) }
          } else {
            // prefer manual input when provided, otherwise use selected list value
            const manual = (data.deptNameManual || '').toString().trim()
            const list = (data.deptNameFromList || '').toString().trim()
            const chosen = manual.length > 0 ? manual : list.length > 0 ? list : undefined
            if (typeof chosen !== 'undefined' && chosen !== '')
              subjectObj['department.name'] = { [operator]: chosen }
          }
        } else if (data.deptMatchBy === 'code') {
          if (isArrayApplies(applies)) {
            // prefer manual-sourced tags when available, otherwise use list-sourced tags
            const manualVals = deptValuesManual || []
            const listVals = deptValuesFromList || []
            const fallback = data.deptValues || []
            const chosenVals =
              manualVals.length > 0 ? manualVals : listVals.length > 0 ? listVals : fallback
            if (chosenVals.length) subjectObj['department.code'] = { [operator]: chosenVals }
          } else {
            if (data.deptCodeFromList)
              subjectObj['department.code'] = { [operator]: data.deptCodeFromList }
          }
        }
      }

      parsed.subject = subjectObj

      // resource: structured selection (operator + resource type) will populate resource.type
      if (data.resourceOperator && (data.resourceTypeFromList || '').trim().length > 0) {
        parsed.resource = { type: { [data.resourceOperator]: data.resourceTypeFromList } }
      }

      // Build parsed.conditions from selectedConditions map (keyed by condition id)
      try {
        const condObj: Record<string, any> = {}
        const entries = Object.entries(selectedConditions || {}) as Array<
          [string, { operator?: string; value?: string }]
        >
        entries.forEach(([id, info]) => {
          if (!info || !info.operator) return
          const cond = (conditionsResp || []).find((c: any) => c.id === id)
          if (!cond) return
          const name = cond.name
          let val: any = info.value
          const dtype = String(cond.dataType || 'string')
          if (dtype === 'number') {
            const n = Number(val)
            if (!Number.isNaN(n)) val = n
          } else if (dtype === 'datetime') {
            // normalize datetime-local 'YYYY-MM-DDTHH:MM' to ISO UTC string
            try {
              if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(val)) {
                // ensure seconds present
                let v = val
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) v = v + ':00'
                const iso = new Date(v)
                if (!Number.isNaN(iso.getTime())) val = iso.toISOString()
              }
            } catch {
              // leave as provided
            }
          }

          if (!condObj[name]) condObj[name] = {}
          condObj[name][info.operator as string] = val
        })

        parsed.conditions = condObj
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
      <DialogContent
        className={
          initialData
            ? 'max-h-[80vh] !max-w-[80vw] overflow-auto'
            : 'max-h-[80vh] !max-w-[70vw] overflow-auto'
        }
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {viewOnly ? 'Xem chi tiết policy' : initialData ? 'Chỉnh sửa policy' : 'Thêm policy'}
          </DialogTitle>
          <DialogDescription>
            {viewOnly ? 'Chế độ chỉ xem' : initialData ? 'Cập nhật policy' : 'Tạo policy mới'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={localViewOnly ? (e) => e.preventDefault() : form.handleSubmit(handleSubmit)}
            // increase vertical spacing between sections to improve readability
            className="space-y-6"
          >
            {/* Disable all inputs when viewOnly is true using a fieldset */}
            <fieldset disabled={!!localViewOnly} style={{ border: 0, padding: 0, margin: 0 }}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên policy</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                        placeholder="Tên policy"
                        {...field}
                      />
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
                      <Input
                        className="disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                        placeholder="read, write, delete"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Subject: Role / Department structured */}
              <div className="space-y-2 rounded-md border p-3">
                <div className="mb-2">
                  <h4 className="text-sm font-medium">Subject</h4>
                  <p className="text-xs text-slate-500">
                    Định nghĩa đối tượng (subject) của policy: role / department rules
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name="includeRole"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <Checkbox
                          checked={!!field.value}
                          onCheckedChange={(v) => field.onChange(Boolean(v))}
                        />
                        <FormLabel>Role</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeDepartment"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <Checkbox
                          checked={!!field.value}
                          onCheckedChange={(v) => field.onChange(Boolean(v))}
                        />
                        <FormLabel>Department</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {/* watch values to decide what to render */}
                {(() => {
                  const includeRole = form.watch('includeRole')
                  const includeDepartment = form.watch('includeDepartment')
                  const roleMatchBy = form.watch('roleMatchBy')
                  const roleOperatorWatch = form.watch('roleOperator')
                  const roleValuesWatch = form.watch('roleValues') || []
                  const deptMatchBy = form.watch('deptMatchBy')
                  const deptValuesWatch = form.watch('deptValues') || []

                  // disable list-selects when the manual input has content OR when there are manual-sourced tags
                  const roleManualHas =
                    String(roleArrayInput).trim().length > 0 || roleValuesManual.length > 0
                  const roleLevelManualHas =
                    String(roleLevelInput).trim().length > 0 || roleValuesManual.length > 0
                  const deptManualHas =
                    String(deptArrayInput).trim().length > 0 || deptValuesManual.length > 0
                  // typing flags: when the typed/manual input has content we want to visually cross-out list-sourced tags
                  const roleTyping = String(roleArrayInput).trim().length > 0
                  const roleLevelTyping = String(roleLevelInput).trim().length > 0
                  const deptTyping = String(deptArrayInput).trim().length > 0

                  return (
                    <>
                      {includeRole && (
                        <div className="space-y-3">
                          {/* 3 cột: Match By | Operator | Value */}
                          <div className="grid grid-cols-3 gap-4">
                            {/* Cột 1: Match By */}
                            <FormField
                              control={form.control}
                              name="roleMatchBy"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Match by</FormLabel>
                                  <FormControl>
                                    <select
                                      {...field}
                                      className="input w-full rounded-md border px-3 py-2"
                                    >
                                      <option value="name">Name</option>
                                      <option value="level">Level</option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Cột 2: Operator */}
                            <FormField
                              control={form.control}
                              name="roleOperator"
                              render={({ field }) => {
                                const filteredOps =
                                  roleOperators ||
                                  filterOperatorsByType(
                                    roleMatchBy === 'name' ? 'string' : 'number'
                                  )
                                return (
                                  <FormItem>
                                    <FormLabel>Operator</FormLabel>
                                    <FormControl>
                                      <select
                                        {...field}
                                        className="input w-full rounded-md border px-3 py-2"
                                      >
                                        <option value="">-- chọn --</option>
                                        {filteredOps.map((op) => (
                                          <option key={op.id} value={op.name}>
                                            {formatOperatorLabel(op)}
                                          </option>
                                        ))}
                                      </select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )
                              }}
                            />

                            {/* Cột 3: Value - hiển thị theo roleMatchBy */}
                            <div className="space-y-2">
                              {roleMatchBy === 'name' &&
                                (() => {
                                  const roleNameManualVal = form.watch('roleNameManual') || ''
                                  const roleSelectDisabled =
                                    String(roleNameManualVal).trim().length > 0

                                  return (
                                    <>
                                      {/* Operator appliesTo logic: if selected operator supports array, show tag multi-value UI */}
                                      {(() => {
                                        const selectedOp = getOperatorByName(roleOperatorWatch)
                                        const applies = selectedOp?.appliesTo || []
                                        const isArray = isArrayApplies(applies)
                                        const isNumber = applies.includes('number') && !isArray

                                        if (isArray) {
                                          // show both select-from-list (with Add) and manual tag input for multi values
                                          return (
                                            <div>
                                              <FormLabel>Values (multi)</FormLabel>
                                              <div className="flex items-center gap-2">
                                                <FormField
                                                  control={form.control}
                                                  name="roleNameFromList"
                                                  render={({ field }) => (
                                                    <FormItem>
                                                      <FormControl>
                                                        <select
                                                          {...field}
                                                          className="input w-full rounded-md border px-3 py-2"
                                                          disabled={roleManualHas}
                                                        >
                                                          <option value="">
                                                            -- chọn vai trò --
                                                          </option>
                                                          {(rolesResp || []).map((r) => (
                                                            <option key={r.id} value={r.name}>
                                                              {r.name}
                                                            </option>
                                                          ))}
                                                        </select>
                                                      </FormControl>
                                                    </FormItem>
                                                  )}
                                                />
                                                <button
                                                  type="button"
                                                  className="btn rounded bg-slate-100 px-3 py-1"
                                                  onClick={() => {
                                                    const sel = form.getValues('roleNameFromList')
                                                    if (sel) {
                                                      addArrayValue(
                                                        'roleValues',
                                                        String(sel),
                                                        'list'
                                                      )
                                                      form.setValue('roleNameFromList', '')
                                                    }
                                                  }}
                                                  disabled={roleManualHas}
                                                >
                                                  Add
                                                </button>

                                                <Input
                                                  placeholder="Nhập giá trị, nhấn Enter hoặc dấu ,"
                                                  value={roleArrayInput}
                                                  onChange={(e) =>
                                                    setRoleArrayInput(e.target.value)
                                                  }
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ',') {
                                                      e.preventDefault()
                                                      const val = (
                                                        e.target as HTMLInputElement
                                                      ).value
                                                        .trim()
                                                        .replace(/,$/, '')
                                                      if (val) {
                                                        addArrayValue('roleValues', val)
                                                        setRoleArrayInput('')
                                                      }
                                                    }
                                                  }}
                                                />
                                              </div>
                                              <div className="mt-2 flex flex-wrap gap-2">
                                                {(roleValuesWatch || []).map((v: string) => {
                                                  const isManual = roleValuesManual.includes(v)
                                                  const strike = !isManual && roleTyping
                                                  return (
                                                    <span
                                                      key={`${isManual ? 'manual' : 'list'}-${v}`}
                                                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-sm ${isManual ? 'bg-blue-100' : 'bg-slate-100'} ${strike ? 'text-red-600 line-through decoration-red-500 opacity-90' : ''}`}
                                                    >
                                                      <span>{v}</span>
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          removeArrayValue('roleValues', v)
                                                        }
                                                      >
                                                        ×
                                                      </button>
                                                    </span>
                                                  )
                                                })}
                                              </div>
                                            </div>
                                          )
                                        }

                                        // else fallback to single selection/manual (string or number)
                                        return (
                                          <>
                                            <FormField
                                              control={form.control}
                                              name="roleNameFromList"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Role (from list)</FormLabel>
                                                  <FormControl>
                                                    <select
                                                      {...field}
                                                      disabled={roleSelectDisabled}
                                                      className="input w-full rounded-md border px-3 py-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                                                      onChange={(e) => {
                                                        field.onChange(e.target.value)
                                                        if (e.target.value)
                                                          form.setValue('roleNameManual', '')
                                                      }}
                                                    >
                                                      <option value="">-- chọn vai trò --</option>
                                                      {(rolesResp || []).map((r) => (
                                                        <option key={r.id} value={r.name}>
                                                          {r.name}
                                                        </option>
                                                      ))}
                                                    </select>
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />

                                            <FormField
                                              control={form.control}
                                              name="roleNameManual"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>
                                                    Role (manual){isNumber ? ' (number)' : ''}
                                                  </FormLabel>
                                                  <FormControl>
                                                    <Input
                                                      className="disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                                                      placeholder={
                                                        isNumber ? 'Gõ số' : 'Gõ tên role'
                                                      }
                                                      {...field}
                                                      onChange={(e) => {
                                                        const v = e.target.value
                                                        field.onChange(v)
                                                        if (String(v).trim().length > 0) {
                                                          form.setValue('roleNameFromList', '')
                                                        }
                                                      }}
                                                    />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                          </>
                                        )
                                      })()}
                                    </>
                                  )
                                })()}

                              {roleMatchBy === 'level' &&
                                (() => {
                                  const selectedOp = getOperatorByName(roleOperatorWatch)
                                  const applies = selectedOp?.appliesTo || []
                                  const isArrayLevel = applies.includes('array_number')

                                  if (isArrayLevel) {
                                    return (
                                      <div>
                                        <FormLabel>Role level (multi)</FormLabel>
                                        <div className="flex items-center gap-2">
                                          <select
                                            id="roleLevelSelect"
                                            className="input rounded-md border px-3 py-2"
                                            disabled={roleLevelManualHas}
                                          >
                                            <option value="">-- chọn level --</option>
                                            {Array.from({ length: 10 }).map((_, i) => (
                                              <option key={i + 1} value={String(i + 1)}>
                                                {i + 1}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            type="button"
                                            className="btn rounded bg-slate-100 px-3 py-1"
                                            onClick={() => {
                                              const sel = (
                                                document.getElementById(
                                                  'roleLevelSelect'
                                                ) as HTMLSelectElement
                                              )?.value
                                              if (sel) addArrayValue('roleValues', sel, 'list')
                                              try {
                                                const el = document.getElementById(
                                                  'roleLevelSelect'
                                                ) as HTMLSelectElement
                                                if (el) el.value = ''
                                              } catch {}
                                            }}
                                            disabled={roleLevelManualHas}
                                          >
                                            Add
                                          </button>

                                          <Input
                                            placeholder="Nhập số, nhấn Enter"
                                            value={roleLevelInput}
                                            onChange={(e) => setRoleLevelInput(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault()
                                                const val = (
                                                  e.target as HTMLInputElement
                                                ).value.trim()
                                                if (val) {
                                                  addArrayValue('roleValues', val)
                                                  setRoleLevelInput('')
                                                }
                                              }
                                            }}
                                          />
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {(roleValuesWatch || []).map((v: string) => {
                                            const isManual = roleValuesManual.includes(v)
                                            const strike = !isManual && roleLevelTyping
                                            return (
                                              <span
                                                key={`${isManual ? 'manual' : 'list'}-${v}`}
                                                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-sm ${isManual ? 'bg-blue-100' : 'bg-slate-100'} ${strike ? 'text-red-600 line-through decoration-red-500 opacity-90' : ''}`}
                                              >
                                                <span>{v}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => removeArrayValue('roleValues', v)}
                                                >
                                                  ×
                                                </button>
                                              </span>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )
                                  }

                                  // fallback single select
                                  return (
                                    <FormField
                                      control={form.control}
                                      name="roleLevel"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Role level</FormLabel>
                                          <FormControl>
                                            <select
                                              {...field}
                                              className="input w-full rounded-md border px-3 py-2"
                                            >
                                              <option value="">Chọn level</option>
                                              {Array.from({ length: 10 }).map((_, i) => (
                                                <option key={i + 1} value={String(i + 1)}>
                                                  {i + 1}
                                                </option>
                                              ))}
                                            </select>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )
                                })()}
                            </div>
                          </div>
                        </div>
                      )}

                      {includeDepartment && (
                        <div className="space-y-3">
                          {/* 3 cột: Match By | Operator | Value */}
                          <div className="grid grid-cols-3 gap-4">
                            {/* Cột 1: Match By */}
                            <FormField
                              control={form.control}
                              name="deptMatchBy"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Match by</FormLabel>
                                  <FormControl>
                                    <select
                                      {...field}
                                      className="input w-full rounded-md border px-3 py-2"
                                    >
                                      <option value="name">Name</option>
                                      <option value="code">Code</option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Cột 2: Operator */}
                            <FormField
                              control={form.control}
                              name="deptOperator"
                              render={({ field }) => {
                                // Department name is string, code is also string
                                const filteredOps = deptOperators || filterOperatorsByType('string')
                                return (
                                  <FormItem>
                                    <FormLabel>Operator</FormLabel>
                                    <FormControl>
                                      <select
                                        {...field}
                                        className="input w-full rounded-md border px-3 py-2"
                                      >
                                        <option value="">-- chọn --</option>
                                        {filteredOps.map((op) => (
                                          <option key={op.id} value={op.name}>
                                            {formatOperatorLabel(op)}
                                          </option>
                                        ))}
                                      </select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )
                              }}
                            />

                            {/* Cột 3: Value - hiển thị theo deptMatchBy */}
                            <div className="space-y-2">
                              {deptMatchBy === 'name' &&
                                (() => {
                                  const selectedOp = getOperatorByName(
                                    form.getValues('deptOperator')
                                  )
                                  const applies = selectedOp?.appliesTo || []
                                  const isArray = isArrayApplies(applies)

                                  if (isArray) {
                                    return (
                                      <div>
                                        <FormLabel>Values (multi)</FormLabel>
                                        <div className="flex items-center gap-2">
                                          <FormField
                                            control={form.control}
                                            name="deptNameFromList"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormControl>
                                                  <select
                                                    {...field}
                                                    className="input w-full rounded-md border px-3 py-2"
                                                    disabled={deptManualHas}
                                                  >
                                                    <option value="">-- chọn bộ phận --</option>
                                                    {(deptsResp || []).map((d) => (
                                                      <option key={d.id} value={d.name}>
                                                        {d.name}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </FormControl>
                                              </FormItem>
                                            )}
                                          />
                                          <button
                                            type="button"
                                            className="btn rounded bg-slate-100 px-3 py-1"
                                            onClick={() => {
                                              const sel = form.getValues('deptNameFromList')
                                              if (sel) {
                                                addArrayValue('deptValues', String(sel), 'list')
                                                form.setValue('deptNameFromList', '')
                                              }
                                            }}
                                            disabled={deptManualHas}
                                          >
                                            Add
                                          </button>

                                          <Input
                                            placeholder="Thêm giá trị, nhấn Enter hoặc dấu ,"
                                            value={deptArrayInput}
                                            onChange={(e) => setDeptArrayInput(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' || e.key === ',') {
                                                e.preventDefault()
                                                const val = (e.target as HTMLInputElement).value
                                                  .trim()
                                                  .replace(/,$/, '')
                                                if (val) {
                                                  addArrayValue('deptValues', val, 'manual')
                                                  setDeptArrayInput('')
                                                }
                                              }
                                            }}
                                          />
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {(deptValuesWatch || []).map((v: string) => {
                                            const isManual = deptValuesManual.includes(v)
                                            const strike = !isManual && deptTyping
                                            return (
                                              <span
                                                key={`${isManual ? 'manual' : 'list'}-${v}`}
                                                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-sm ${isManual ? 'bg-blue-100' : 'bg-slate-100'} ${strike ? 'text-red-600 line-through decoration-red-500 opacity-90' : ''}`}
                                              >
                                                <span>{v}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => removeArrayValue('deptValues', v)}
                                                >
                                                  ×
                                                </button>
                                              </span>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )
                                  }

                                  // else single value
                                  const deptNameManualVal = form.watch('deptNameManual') || ''
                                  const deptSelectDisabled =
                                    String(deptNameManualVal).trim().length > 0

                                  return (
                                    <>
                                      <FormField
                                        control={form.control}
                                        name="deptNameFromList"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Department (from list)</FormLabel>
                                            <FormControl>
                                              <select
                                                {...field}
                                                disabled={deptSelectDisabled}
                                                className="input w-full rounded-md border px-3 py-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                                                onChange={(e) => {
                                                  field.onChange(e.target.value)
                                                  if (e.target.value)
                                                    form.setValue('deptNameManual', '')
                                                }}
                                              >
                                                <option value="">-- chọn bộ phận --</option>
                                                {(deptsResp || []).map((d) => (
                                                  <option key={d.id} value={d.name}>
                                                    {d.name}
                                                  </option>
                                                ))}
                                              </select>
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={form.control}
                                        name="deptNameManual"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Department (manual)</FormLabel>
                                            <FormControl>
                                              <Input
                                                className="disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                                                placeholder="Gõ tên bộ phận"
                                                {...field}
                                                onChange={(e) => {
                                                  const v = e.target.value
                                                  field.onChange(v)
                                                  if (String(v).trim().length > 0) {
                                                    form.setValue('deptNameFromList', '')
                                                  }
                                                }}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </>
                                  )
                                })()}

                              {deptMatchBy === 'code' && (
                                <FormField
                                  control={form.control}
                                  name="deptCodeFromList"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Department code</FormLabel>
                                      <FormControl>
                                        <select
                                          {...field}
                                          className="input w-full rounded-md border px-3 py-2"
                                        >
                                          <option value="">-- chọn code --</option>
                                          {(deptsResp || []).map((d) => (
                                            <option key={d.id} value={d.code}>
                                              {d.code} - {d.name}
                                            </option>
                                          ))}
                                        </select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>

              {/* Resource: Operator | ResourceType */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="resourceOperator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Operator</FormLabel>
                      <FormControl>
                        <select {...field} className="input w-full rounded-md border px-3 py-2">
                          <option value="">-- chọn --</option>
                          {(filterOperatorsByType('string') || []).map((op) => (
                            <option key={op.id} value={op.name}>
                              {formatOperatorLabel(op)}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resourceTypeFromList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource type</FormLabel>
                      <FormControl>
                        <select {...field} className="input w-full rounded-md border px-3 py-2">
                          <option value="">-- chọn loại resource --</option>
                          {resourceTypesLoading && <option disabled>Loading...</option>}
                          {resourceTypesError && (
                            <option disabled>Failed to load (see console)</option>
                          )}
                          {!resourceTypesLoading &&
                            !resourceTypesError &&
                            resourceTypes.length === 0 && (
                              <option disabled>No resource types found</option>
                            )}
                          {resourceTypes.map((r: any) => (
                            <option key={r.id} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      {resourceTypesError && (
                        <div className="mt-1 text-sm text-red-500">
                          Failed to load resource types.{' '}
                          <button
                            type="button"
                            className="underline"
                            onClick={() => refetchResourceTypes()}
                          >
                            Retry
                          </button>
                        </div>
                      )}
                      {/* Debug: log fetched resource types */}
                      {typeof window !== 'undefined' &&
                        resourceTypes &&
                        (console.debug('[PolicyFormModal] resourceTypes', resourceTypes), null)}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormItem>
                <FormLabel>Conditions</FormLabel>
                <FormControl>
                  <div>
                    {conditionsLoading && <div className="text-sm">Loading conditions...</div>}
                    {conditionsError && (
                      <div className="text-sm text-red-500">
                        Failed to load conditions.{' '}
                        <button
                          type="button"
                          className="underline"
                          onClick={() => refetchConditions()}
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    <div className="max-h-48 overflow-auto rounded-md border p-2">
                      {(conditionsResp || []).map((c: any) => {
                        const dtype = String(c.dataType || 'string')
                        const ops =
                          filterOperatorsByType(dtype === 'number' ? 'number' : 'string') || []
                        const sel = selectedConditions[c.id]
                        return (
                          <div key={c.id} className="grid grid-cols-3 items-center gap-3 py-1">
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={!!sel}
                                onChange={() => toggleCondition(c.id)}
                              />
                              <div className="text-sm">
                                <div className="font-medium">{c.name}</div>
                                {c.description && (
                                  <div className="text-xs text-slate-500">{c.description}</div>
                                )}
                              </div>
                            </div>

                            <div>
                              <select
                                className="input w-full rounded-md border px-3 py-2"
                                disabled={!sel}
                                value={(sel && sel.operator) || (ops[0] && ops[0].name) || ''}
                                onChange={(e) => setConditionOperator(c.id, e.target.value)}
                              >
                                {ops.map((op) => (
                                  <option key={op.id} value={op.name}>
                                    {formatOperatorLabel(op)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              {dtype === 'datetime' ? (
                                // datetime-local expects value in "YYYY-MM-DDTHH:MM" (no seconds). Convert/accept as-is.
                                <Input
                                  type="datetime-local"
                                  className="w-full"
                                  disabled={!sel}
                                  value={(sel && sel.value) || ''}
                                  onChange={(e) => setConditionValue(c.id, e.target.value)}
                                  placeholder="YYYY-MM-DDThh:mm"
                                />
                              ) : dtype === 'number' ? (
                                <Input
                                  type="number"
                                  className="w-full"
                                  disabled={!sel}
                                  value={(sel && sel.value) || ''}
                                  onChange={(e) => setConditionValue(c.id, e.target.value)}
                                  placeholder="Số"
                                />
                              ) : (
                                // default: string. For specific names like ipAddress we show a pattern hint
                                <Input
                                  type="text"
                                  className="w-full"
                                  disabled={!sel}
                                  value={(sel && sel.value) || ''}
                                  onChange={(e) => setConditionValue(c.id, e.target.value)}
                                  placeholder={
                                    c.name === 'ipAddress'
                                      ? 'Ví dụ: 192.168.1.1, 2001:0db8::1'
                                      : 'Chuỗi'
                                  }
                                  title={
                                    c.name === 'ipAddress'
                                      ? 'Cho phép nhiều IP, cách nhau bằng dấu phẩy. Hỗ trợ IPv4 và IPv6'
                                      : undefined
                                  }
                                />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* inline condition errors */}
                    <div className="mt-2">
                      {Object.entries(conditionErrors || {}).map(([id, err]) =>
                        err ? (
                          <div key={id} className="text-sm text-red-600">
                            {err}
                          </div>
                        ) : null
                      )}
                      {submitError && (
                        <div className="mt-1 text-sm text-red-600">{submitError}</div>
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </fieldset>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {viewOnly ? 'Đóng' : 'Hủy'}
              </Button>
              {localViewOnly ? (
                // when viewing, allow switching to edit mode if parent provided handler
                <Button
                  type="button"
                  onClick={() => {
                    console.debug('[PolicyFormModal] onRequestEdit clicked')
                    // enable locally for immediate UX
                    setLocalViewOnly(false)
                    try {
                      // focus first field for convenience
                      if (typeof form.setFocus === 'function') form.setFocus('name')
                    } catch {}
                    if (typeof onRequestEdit === 'function') onRequestEdit()
                  }}
                  style={{ pointerEvents: 'auto' }}
                  aria-disabled={false}
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialData ? 'Lưu' : 'Tạo'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
