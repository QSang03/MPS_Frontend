'use client'

import { useEffect, useState, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import DateTimeLocalPicker from '@/components/ui/DateTimeLocalPicker'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Settings,
  X,
  Plus,
  Shield,
  Users,
  Building2,
  FileCode,
  Filter,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import type { Policy } from '@/types/policies'
import { useQuery } from '@tanstack/react-query'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'
import { policiesClientService } from '@/lib/api/services/policies-client.service'
import type { PolicyOperator } from '@/lib/api/services/policies-client.service'
import { policyConditionsClientService } from '@/lib/api/services/policy-conditions-client.service'
import type { PolicyCondition } from '@/lib/api/services/policy-conditions-client.service'
import { Checkbox } from '@/components/ui/checkbox'
import removeEmpty from '@/lib/utils/clean'
import { sanitizeSubject } from '@/lib/policies/policy-form.utils'

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
  conditions: z.string().optional(),
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
  const [localViewOnly, setLocalViewOnly] = useState(!!viewOnly)

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

  // [KHU VỰC FETCH DATA - GIỮ NGUYÊN]
  const { data: rolesResp } = useQuery({
    queryKey: ['roles', 'for-policy'],
    queryFn: async () => (await rolesClientService.getRoles({ page: 1, limit: 100 })).data,
    staleTime: 1000 * 60 * 5,
  })

  const { data: deptsResp } = useQuery({
    queryKey: ['departments', 'for-policy'],
    queryFn: async () =>
      (await departmentsClientService.getDepartments({ page: 1, limit: 100 })).data,
    staleTime: 1000 * 60 * 5,
  })

  const { data: operatorsResp } = useQuery({
    queryKey: ['policy-operators'],
    queryFn: () => policiesClientService.getPolicyOperators(),
    staleTime: 1000 * 60 * 10,
  })

  const roleMatchBy = form.watch('roleMatchBy')
  const deptMatchBy = form.watch('deptMatchBy')
  const _rawRoleValues = useWatch({ control: form.control, name: 'roleValues' })
  const _rawDeptValues = useWatch({ control: form.control, name: 'deptValues' })
  const roleValuesWatch = useMemo(
    () => (Array.isArray(_rawRoleValues) ? (_rawRoleValues as string[]) : []),
    [_rawRoleValues]
  )
  const deptValuesWatch = useMemo(
    () => (Array.isArray(_rawDeptValues) ? (_rawDeptValues as string[]) : []),
    [_rawDeptValues]
  )

  const [roleArrayInput, setRoleArrayInput] = useState('')
  const [roleLevelInput, setRoleLevelInput] = useState('')
  const [deptArrayInput, setDeptArrayInput] = useState('')
  const [roleValuesFromList, setRoleValuesFromList] = useState<string[]>([])
  const [roleValuesManual, setRoleValuesManual] = useState<string[]>([])
  const [deptValuesFromList, setDeptValuesFromList] = useState<string[]>([])
  const [deptValuesManual, setDeptValuesManual] = useState<string[]>([])

  // [TOÀN BỘ LOGIC USEEFFECT - GIỮ NGUYÊN]
  useEffect(() => {
    const arraysEqual = (a: string[], b: string[]) => {
      if (a === b) return true
      if (!a || !b) return false
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
      return true
    }

    const roleNames = (rolesResp || []).map((r: unknown) => {
      const name = (r as Record<string, unknown>)?.name
      return String(name ?? '').toLowerCase()
    })
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

    const deptNames = (deptsResp || []).map((d: unknown) => {
      const name = (d as Record<string, unknown>)?.name
      return String(name ?? '').toLowerCase()
    })
    const deptCodes = (deptsResp || []).map((d: unknown) => {
      const code = (d as Record<string, unknown>)?.code
      return String(code ?? '').toLowerCase()
    })
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
  }, [
    rolesResp,
    deptsResp,
    roleValuesWatch,
    deptValuesWatch,
    deptMatchBy,
    roleValuesFromList,
    roleValuesManual,
    deptValuesFromList,
    deptValuesManual,
  ])

  const { data: roleOperators } = useQuery({
    queryKey: ['policy-operators', 'role', roleMatchBy],
    queryFn: async () => {
      const appliesTo = roleMatchBy === 'name' ? 'string' : 'number'
      const ops = await policiesClientService.getPolicyOperators(appliesTo)
      // Always include $exists as a special operator
      const hasExists = ops.some((op) => op.name === '$exists')
      if (!hasExists) {
        ops.push({
          id: '$exists',
          name: '$exists',
          description: 'Tồn tại (exists)',
          appliesTo: ['string', 'number', 'boolean'],
        })
      }
      return ops
    },
    enabled: !!roleMatchBy,
    staleTime: 1000 * 60 * 10,
  })

  const { data: deptOperators } = useQuery({
    queryKey: ['policy-operators', 'dept', deptMatchBy],
    queryFn: async () => {
      const ops = await policiesClientService.getPolicyOperators('string')
      // Always include $exists as a special operator
      const hasExists = ops.some((op) => op.name === '$exists')
      if (!hasExists) {
        ops.push({
          id: '$exists',
          name: '$exists',
          description: 'Tồn tại (exists)',
          appliesTo: ['string', 'number', 'boolean'],
        })
      }
      return ops
    },
    enabled: !!deptMatchBy,
    staleTime: 1000 * 60 * 10,
  })

  useEffect(() => {
    if (operatorsResp) {
      console.debug(
        '[debug] operatorsResp count',
        operatorsResp.length,
        operatorsResp.map((o) => o.name)
      )
    }
  }, [operatorsResp])

  const {
    data: resourceTypesResp,
    error: resourceTypesError,
    isLoading: resourceTypesLoading,
    refetch: refetchResourceTypes,
  } = useQuery({
    queryKey: ['resource-types'],
    queryFn: () => policiesClientService.getResourceTypes({ limit: 100 }),
    staleTime: 1000 * 60 * 10,
  })

  const resourceTypes = useMemo(() => {
    if (!resourceTypesResp) return [] as Record<string, unknown>[]
    if (Array.isArray(resourceTypesResp)) return resourceTypesResp as Record<string, unknown>[]
    if (resourceTypesResp && typeof resourceTypesResp === 'object' && 'data' in resourceTypesResp)
      return ((resourceTypesResp as { data?: unknown }).data as Record<string, unknown>[]) || []
    return []
  }, [resourceTypesResp])

  useEffect(() => {
    if (isOpen) {
      refetchResourceTypes()
        .then((res) => {
          console.debug('[PolicyFormModal] refetchResourceTypes result', res)
        })
        .catch((err) => {
          console.error('[PolicyFormModal] refetchResourceTypes error', err)
        })
    }
  }, [isOpen, refetchResourceTypes])

  useEffect(() => {
    if (isOpen) {
      setLocalViewOnly(!!viewOnly)
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
    const fromRole = (roleOperators || []).find((op) => op.name === name)
    if (fromRole) return fromRole
    const fromDept = (deptOperators || []).find((op) => op.name === name)
    if (fromDept) return fromDept
    if (!operatorsResp) return null
    return operatorsResp.find((op) => op.name === name)
  }

  useEffect(() => {
    const op = getOperatorByName(form.getValues('roleOperator'))
    const applies = op?.appliesTo || []
    const isArray = isArrayApplies(applies)
    if (isArray) {
      if (form.getValues('roleNameManual')) form.setValue('roleNameManual', '')
      if (form.getValues('roleLevel')) form.setValue('roleLevel', '')
    } else {
      if (roleArrayInput) setRoleArrayInput('')
      if ((roleValuesManual || []).length > 0) {
        setRoleValuesManual([])
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
    let filtered: PolicyOperator[] = []
    if (dataType === 'string') {
      filtered = operatorsResp.filter(
        (op) => op.appliesTo?.includes('string') || op.appliesTo?.includes('array_string')
      )
    } else {
      filtered = operatorsResp.filter(
        (op) => op.appliesTo?.includes('number') || op.appliesTo?.includes('array_number')
      )
    }
    // Always include $exists as a special operator
    const hasExists = filtered.some((op) => op.name === '$exists')
    if (!hasExists) {
      filtered.push({
        id: '$exists',
        name: '$exists',
        description: 'Tồn tại (exists)',
        appliesTo: ['string', 'number', 'boolean'],
      })
    }
    return filtered
  }

  const {
    data: conditionsResp,
    isLoading: conditionsLoading,
    error: conditionsError,
    refetch: refetchConditions,
  } = useQuery({
    queryKey: ['policy-conditions'],
    queryFn: () => policyConditionsClientService.getPolicyConditions({ limit: 100 }),
    staleTime: 1000 * 60 * 10,
  })

  const [selectedConditions, setSelectedConditions] = useState<
    Record<string, { operator?: string; value?: string }>
  >({})
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
    const cond = (conditionsResp || []).find(
      (c: unknown) => (c as Record<string, unknown>)?.id === id
    ) as Record<string, unknown> | undefined
    if (cond && cond.name === 'ipAddress') {
      const raw = String(val || '')
      const parts = raw
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
      if (parts.length === 0) {
        setConditionErrors((s) => ({ ...s, [id]: null }))
      } else {
        const ipv4 =
          /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/
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

  const includeRoleWatch = form.watch('includeRole')
  const includeDepartmentWatch = form.watch('includeDepartment')

  useEffect(() => {
    if (includeRoleWatch) {
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

      if (initialData.resource) {
        try {
          const r = initialData.resource as Record<string, unknown> | undefined
          if (r && typeof r === 'object' && 'type' in r) {
            const t = (r as Record<string, unknown>).type
            if (t && typeof t === 'object') {
              const detectedOp = Object.keys(t).find((k) => String(k).startsWith('$'))
              if (detectedOp) {
                values.resourceOperator = detectedOp
                const val = (t as Record<string, unknown>)[detectedOp]
                if (typeof val === 'string' || typeof val === 'number')
                  values.resourceTypeFromList = String(val)
                else values.resourceTypeFromList = JSON.stringify(val)
              }
            } else if (typeof t === 'string' || typeof t === 'number') {
              values.resourceOperator = values.resourceOperator || '$eq'
              values.resourceTypeFromList = String(t)
            }
          }
        } catch {}
      }

      if (includeRole) {
        if (subj['role.name']) {
          values.roleMatchBy = 'name'
          const roleNameObj = subj['role.name'] as Record<string, unknown> | unknown
          const detectedOp =
            typeof roleNameObj === 'object' && roleNameObj !== null
              ? Object.keys(roleNameObj as object).find((k) => k.startsWith('$'))
              : undefined
          values.roleOperator = detectedOp || '$eq'
          const val =
            detectedOp && (roleNameObj as Record<string, unknown>)[detectedOp]
              ? (roleNameObj as Record<string, unknown>)[detectedOp]
              : roleNameObj
          if (Array.isArray(val)) {
            values.roleValues = val.map((v: unknown) => String(v as string))
            values.roleUseList = false
          } else {
            values.roleNameManual = typeof val === 'string' ? String(val) : ''
            values.roleUseList = true
            values.roleNameFromList = typeof val === 'string' ? String(val) : ''
          }
        } else if (subj['attributes.role']) {
          values.roleMatchBy = 'name'
          const roleNameObj = subj['attributes.role'] as Record<string, unknown> | unknown
          const detectedOp =
            typeof roleNameObj === 'object' && roleNameObj !== null
              ? Object.keys(roleNameObj as object).find((k) => k.startsWith('$'))
              : undefined
          values.roleOperator = detectedOp || '$eq'
          const val =
            detectedOp && (roleNameObj as Record<string, unknown>)[detectedOp]
              ? (roleNameObj as Record<string, unknown>)[detectedOp]
              : roleNameObj
          if (Array.isArray(val)) {
            values.roleValues = val.map((v: unknown) => String(v as string))
            values.roleUseList = false
          } else {
            values.roleNameManual = typeof val === 'string' ? String(val) : ''
            values.roleUseList = true
            values.roleNameFromList = typeof val === 'string' ? String(val) : ''
          }
        } else if (subj['role.level']) {
          values.roleMatchBy = 'level'
          const roleLevelObj = subj['role.level'] as Record<string, unknown> | unknown
          const detectedOp =
            typeof roleLevelObj === 'object' && roleLevelObj !== null
              ? Object.keys(roleLevelObj as object).find((k) => k.startsWith('$'))
              : undefined
          values.roleOperator = detectedOp || '$eq'
          const val =
            detectedOp && (roleLevelObj as Record<string, unknown>)[detectedOp]
              ? (roleLevelObj as Record<string, unknown>)[detectedOp]
              : roleLevelObj
          if (Array.isArray(val)) {
            // Populate multi-select list for levels
            values.roleValues = (val as unknown[]).map((v) => String(v as number))
          } else {
            // Populate single level
            values.roleLevel = typeof val === 'number' ? String(val) : String(val)
          }
        }
      }

      if (includeDepartment) {
        const deptNameKey = subj['attributes.department']
          ? 'attributes.department'
          : subj['department.name']
            ? 'department.name'
            : undefined
        if (deptNameKey) {
          values.deptMatchBy = 'name'
          const deptNameObj = subj[deptNameKey] as Record<string, unknown> | unknown
          const detectedOp =
            typeof deptNameObj === 'object' && deptNameObj !== null
              ? Object.keys(deptNameObj as object).find((k) => k.startsWith('$'))
              : undefined
          values.deptOperator = detectedOp || '$eq'
          const val =
            detectedOp && (deptNameObj as Record<string, unknown>)[detectedOp]
              ? (deptNameObj as Record<string, unknown>)[detectedOp]
              : deptNameObj
          if (Array.isArray(val)) {
            values.deptValues = val.map((v: unknown) => String(v as string))
            values.deptUseList = false
          } else {
            values.deptNameManual = typeof val === 'string' ? String(val) : ''
            values.deptUseList = true
            values.deptNameFromList = typeof val === 'string' ? String(val) : ''
          }
        } else if (subj['department.code']) {
          values.deptMatchBy = 'code'
          const deptCodeObj = subj['department.code'] as Record<string, unknown> | unknown
          const detectedOp =
            typeof deptCodeObj === 'object' && deptCodeObj !== null
              ? Object.keys(deptCodeObj as object).find((k) => k.startsWith('$'))
              : undefined
          values.deptOperator = detectedOp || '$eq'
          const val =
            detectedOp && (deptCodeObj as Record<string, unknown>)[detectedOp]
              ? (deptCodeObj as Record<string, unknown>)[detectedOp]
              : deptCodeObj
          values.deptCodeFromList = typeof val === 'string' ? String(val) : ''
        }
      }
      form.reset(values)
    } else {
      form.reset(initialFormDefaults)
      setSelectedConditions({})
      setConditionErrors({})
      setRoleArrayInput('')
      setRoleLevelInput('')
      setDeptArrayInput('')
      setRoleValuesFromList([])
      setRoleValuesManual([])
      setDeptValuesFromList([])
      setDeptValuesManual([])
      setLocalViewOnly(!!viewOnly)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, rolesResp, deptsResp])

  const handleSubmit = async (data: PolicyFormData) => {
    setIsLoading(true)
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
        resource: {}, // Initialize resource as empty object - required by backend
      }

      const subjectObj: Record<string, unknown> = {}
      if (data.includeRole) {
        let operator = data.roleOperator || '$eq'
        let opMeta = getOperatorByName(operator)
        const applies = opMeta?.appliesTo || []
        if (data.roleMatchBy === 'name') {
          // Ensure operator is compatible with string fields; fallback to $eq if not
          const stringCompatible = applies.includes('string') || applies.includes('array_string')
          if (!stringCompatible) {
            operator = '$eq'
            opMeta = getOperatorByName(operator)
          }
          if (isArrayApplies(applies)) {
            const manualVals = roleValuesManual || []
            const listVals = roleValuesFromList || []
            const fallback = data.roleValues || []
            const rawChosen =
              manualVals.length > 0 ? manualVals : listVals.length > 0 ? listVals : fallback
            const chosenVals = (rawChosen || []).filter(
              (v) => v !== null && v !== undefined && String(v).trim() !== ''
            )
            if (chosenVals.length) subjectObj['attributes.role'] = { [operator]: chosenVals }
          } else {
            const manual = (data.roleNameManual || '').toString().trim()
            const list = (data.roleNameFromList || '').toString().trim()
            const chosen = manual.length > 0 ? manual : list.length > 0 ? list : undefined
            if (typeof chosen !== 'undefined' && chosen !== '' && chosen !== null)
              subjectObj['attributes.role'] = { [operator]: chosen }
          }
        } else if (data.roleMatchBy === 'level') {
          if (isArrayApplies(applies)) {
            const manualVals = roleValuesManual || []
            const listVals = roleValuesFromList || []
            const fallback = data.roleValues || []
            const rawChosen =
              manualVals.length > 0 ? manualVals : listVals.length > 0 ? listVals : fallback
            const chosen = (rawChosen || []).filter(
              (v) => v !== null && v !== undefined && String(v).trim() !== ''
            )
            const vals = (chosen || []).map((v) => Number(v)).filter((n) => !Number.isNaN(n))
            if (vals.length) subjectObj['role.level'] = { [operator]: vals }
          } else {
            if (
              typeof data.roleLevel !== 'undefined' &&
              data.roleLevel !== '' &&
              data.roleLevel !== null
            )
              subjectObj['role.level'] = { [operator]: Number(data.roleLevel) }
          }
        }
      }

      if (data.includeDepartment) {
        let operator = data.deptOperator || '$eq'
        let opMeta = getOperatorByName(operator)
        const applies = opMeta?.appliesTo || []
        if (data.deptMatchBy === 'name') {
          // Ensure operator is compatible with string fields; fallback to $eq if not
          const stringCompatible = applies.includes('string') || applies.includes('array_string')
          if (!stringCompatible) {
            operator = '$eq'
            opMeta = getOperatorByName(operator)
          }
          if (isArrayApplies(applies)) {
            const manualVals = deptValuesManual || []
            const listVals = deptValuesFromList || []
            const fallback = data.deptValues || []
            const rawChosen =
              manualVals.length > 0 ? manualVals : listVals.length > 0 ? listVals : fallback
            const chosenVals = (rawChosen || []).filter(
              (v) => v !== null && v !== undefined && String(v).trim() !== ''
            )
            if (chosenVals.length) subjectObj['department.name'] = { [operator]: chosenVals }
          } else {
            const manual = (data.deptNameManual || '').toString().trim()
            const list = (data.deptNameFromList || '').toString().trim()
            const chosen = manual.length > 0 ? manual : list.length > 0 ? list : undefined
            if (typeof chosen !== 'undefined' && chosen !== '' && chosen !== null)
              subjectObj['department.name'] = { [operator]: chosen }
          }
        } else if (data.deptMatchBy === 'code') {
          if (isArrayApplies(applies)) {
            const manualVals = deptValuesManual || []
            const listVals = deptValuesFromList || []
            const fallback = data.deptValues || []
            const rawChosen =
              manualVals.length > 0 ? manualVals : listVals.length > 0 ? listVals : fallback
            const chosenVals = (rawChosen || []).filter(
              (v) => v !== null && v !== undefined && String(v).trim() !== ''
            )
            if (chosenVals.length) subjectObj['department.code'] = { [operator]: chosenVals }
          } else {
            if (data.deptCodeFromList)
              subjectObj['department.code'] = { [operator]: data.deptCodeFromList }
          }
        }
      }
      const cleanedSubject = sanitizeSubject(subjectObj)
      if (Object.keys(cleanedSubject).length > 0) {
        parsed.subject = cleanedSubject
      }

      // Client-side validation: ensure subject keys are valid and non-empty
      const allowedSubjectKeys = [
        'attributes.role',
        'role.level',
        'department.name',
        'department.code',
        'attributes.department',
      ]
      const invalidKeys = Object.keys(subjectObj).filter((k) => !allowedSubjectKeys.includes(k))
      if (invalidKeys.length > 0) {
        setSubmitError(`Subject contains invalid keys: ${invalidKeys.join(', ')}`)
        setIsLoading(false)
        return
      }
      // Ensure subject is not empty when includeRole/includeDepartment selected
      if (
        data.includeRole === true &&
        !Object.keys(subjectObj).some(
          (k) => k.startsWith('attributes.role') || k.startsWith('role.')
        )
      ) {
        setSubmitError('Vui lòng chọn hoặc nhập giá trị role hợp lệ')
        setIsLoading(false)
        return
      }
      if (
        data.includeDepartment === true &&
        !Object.keys(subjectObj).some(
          (k) => k.startsWith('department') || k.startsWith('attributes.')
        )
      ) {
        setSubmitError('Vui lòng chọn hoặc nhập giá trị department hợp lệ')
        setIsLoading(false)
        return
      }

      if (data.resourceOperator && (data.resourceTypeFromList || '').trim().length > 0) {
        parsed.resource = { type: { [data.resourceOperator]: data.resourceTypeFromList } }
      }

      try {
        const condObj: Record<string, Record<string, unknown>> = {}
        const entries = Object.entries(selectedConditions || {}) as Array<
          [string, { operator?: string; value?: string }]
        >
        // Validate datetime condition values: when present they must be full datetime (YYYY-MM-DDTHH:mm or with :ss)
        for (const [id, info] of entries) {
          const cond = (conditionsResp || []).find(
            (c: unknown) => (c as Record<string, unknown>)?.id === id
          ) as Record<string, unknown> | undefined
          if (!cond) continue
          const dtype = String(cond.dataType || 'string')
          const val = info?.value
          if (dtype === 'datetime' && typeof val === 'string' && val.trim().length > 0) {
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(val)) {
              setSubmitError(
                'Một điều kiện datetime không hợp lệ hoặc thiếu giờ:phút: ' +
                  String(cond.name ?? id)
              )
              setIsLoading(false)
              return
            }
          }
        }
        entries.forEach(([id, info]) => {
          if (!info || !info.operator) return
          const cond = (conditionsResp || []).find(
            (c: unknown) => (c as Record<string, unknown>)?.id === id
          ) as Record<string, unknown> | undefined
          if (!cond) return
          const name = String(cond.name ?? '')
          if (!name) return
          let val: unknown = info.value
          const dtype = String(cond.dataType || 'string')
          if (dtype === 'number') {
            const n = Number(val)
            if (!Number.isNaN(n)) val = n
          } else if (dtype === 'datetime') {
            try {
              if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(val)) {
                let v = val
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) v = v + ':00'
                const iso = new Date(v)
                if (!Number.isNaN(iso.getTime())) val = iso.toISOString()
              }
            } catch {}
          }
          if (!condObj[name]) condObj[name] = {}
          const op = String(info.operator)
          condObj[name][op] = val
        })
        parsed.conditions = condObj
      } catch {
        parsed.conditions = {}
      }

      // Remove empty fields (empty strings, whitespace-only, empty arrays, empty objects)
      const cleaned = removeEmpty(parsed as Record<string, unknown>) as Partial<Policy>
      try {
        await onSubmit(cleaned)
        onClose()
      } catch (err: unknown) {
        const eObj = err as Record<string, unknown>
        const resp = (eObj.response as Record<string, unknown> | undefined) || undefined
        const status =
          (typeof eObj.statusCode === 'number' ? eObj.statusCode : undefined) ??
          (typeof resp?.status === 'number' ? resp?.status : undefined)
        const body = (resp?.data as unknown) ?? eObj
        const bodyObj = (body as Record<string, unknown> | undefined) || undefined
        const message =
          (bodyObj && typeof bodyObj.message === 'string' && bodyObj.message) ||
          (typeof eObj.message === 'string' && eObj.message) ||
          'Có lỗi khi lưu policy'
        const code = (bodyObj && typeof bodyObj.error === 'string' && bodyObj.error) || 'ERROR'
        const details = bodyObj && bodyObj.details
        const pretty = `[#${String(status ?? '??')}] ${code}: ${String(message)}`
        setSubmitError(pretty + (details ? `\nChi tiết: ${JSON.stringify(details)}` : ''))
        return
      }
    } finally {
      setIsLoading(false)
    }
  }

  // [PHẦN UI MỚI - THIẾT KẾ ĐẸP HƠN]
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <SystemModalLayout
        title={viewOnly ? 'Chi tiết Policy' : initialData ? 'Chỉnh sửa Policy' : 'Tạo Policy Mới'}
        description={
          viewOnly
            ? 'Chế độ xem chi tiết'
            : initialData
              ? 'Cập nhật thông tin policy'
              : 'Định nghĩa quy tắc truy cập và phân quyền'
        }
        icon={Shield}
        variant={viewOnly ? 'view' : initialData ? 'edit' : 'create'}
        maxWidth="!max-w-[75vw]"
        footer={
          <>
            <Button type="button" variant="outline" onClick={onClose} className="min-w-[100px]">
              {viewOnly ? 'Đóng' : 'Hủy'}
            </Button>

            {localViewOnly ? (
              <Button
                type="button"
                onClick={() => {
                  console.debug('[PolicyFormModal] onRequestEdit clicked')
                  setLocalViewOnly(false)
                  try {
                    if (typeof form.setFocus === 'function') form.setFocus('name')
                  } catch {}
                  if (typeof onRequestEdit === 'function') onRequestEdit()
                }}
                style={{ pointerEvents: 'auto' }}
                aria-disabled={false}
                className="min-w-[120px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Settings className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>
            ) : (
              <Button
                type="submit"
                form="policy-form"
                disabled={isLoading}
                onClick={form.handleSubmit(handleSubmit)}
                className="min-w-[120px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {initialData ? 'Lưu thay đổi' : 'Tạo Policy'}
                  </>
                )}
              </Button>
            )}
          </>
        }
      >
        <Form {...form}>
          <form
            onSubmit={localViewOnly ? (e) => e.preventDefault() : form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            <fieldset disabled={localViewOnly} className="space-y-8">
              {/* SECTION: Thông tin cơ bản */}
              <div className="space-y-5 rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-purple-50/30 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Thông tin cơ bản</h3>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Tên Policy *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập tên policy (VD: allow-admin-access)"
                          className="border-gray-300 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="effect"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Effect</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          >
                            <option value="ALLOW">✓ ALLOW (Cho phép)</option>
                            <option value="DENY">✗ DENY (Từ chối)</option>
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
                        <FormLabel className="text-sm font-medium text-gray-700">Actions</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="read, write, delete (ngăn cách bởi dấu phẩy)"
                            className="border-gray-300 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* SECTION: Subject (Role & Department) */}
              <div className="space-y-5 rounded-xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Subject (Đối tượng áp dụng)
                  </h3>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  Định nghĩa quy tắc dựa trên vai trò (role) hoặc phòng ban (department)
                </p>

                {/* Toggle checkboxes */}
                <div className="flex gap-6">
                  <FormField
                    control={form.control}
                    name="includeRole"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(v) => field.onChange(Boolean(v))}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm font-medium text-gray-700">
                          🎭 Áp dụng theo Role
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeDepartment"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(v) => field.onChange(Boolean(v))}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm font-medium text-gray-700">
                          🏢 Áp dụng theo Department
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {/* ROLE SECTION */}
                {(() => {
                  const includeRole = form.watch('includeRole')
                  const includeDepartment = form.watch('includeDepartment')
                  const roleMatchBy = form.watch('roleMatchBy')
                  const roleOperatorWatch = form.watch('roleOperator')
                  const roleValuesWatch = form.watch('roleValues') || []
                  const deptMatchBy = form.watch('deptMatchBy')
                  const deptValuesWatch = form.watch('deptValues') || []

                  const roleManualHas =
                    String(roleArrayInput).trim().length > 0 || roleValuesManual.length > 0
                  const roleLevelManualHas =
                    String(roleLevelInput).trim().length > 0 || roleValuesManual.length > 0
                  const deptManualHas =
                    String(deptArrayInput).trim().length > 0 || deptValuesManual.length > 0

                  const roleTyping = String(roleArrayInput).trim().length > 0
                  const roleLevelTyping = String(roleLevelInput).trim().length > 0
                  const deptTyping = String(deptArrayInput).trim().length > 0

                  return (
                    <>
                      {includeRole && (
                        <div className="mt-4 space-y-4 rounded-lg border border-emerald-200 bg-white/70 p-5">
                          <h4 className="flex items-center gap-2 font-semibold text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            Role Configuration
                          </h4>

                          <div className="grid grid-cols-3 gap-4">
                            {/* Match By */}
                            <FormField
                              control={form.control}
                              name="roleMatchBy"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium text-gray-600">
                                    Match by
                                  </FormLabel>
                                  <FormControl>
                                    <select
                                      {...field}
                                      className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                    >
                                      <option value="name">📛 Name</option>
                                      <option value="level">🔢 Level</option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Operator */}
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
                                    <FormLabel className="text-xs font-medium text-gray-600">
                                      Operator
                                    </FormLabel>
                                    <FormControl>
                                      <select
                                        {...field}
                                        className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                      >
                                        <option value="">-- chọn --</option>
                                        {filteredOps.map((op) => (
                                          <option key={op.name} value={op.name}>
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

                            {/* Value - Dynamic based on matchBy and operator */}
                            {roleMatchBy === 'name' &&
                              (() => {
                                const roleNameManualVal = form.watch('roleNameManual') || ''
                                const roleSelectDisabled =
                                  String(roleNameManualVal).trim().length > 0

                                const selectedOp = getOperatorByName(roleOperatorWatch)
                                const applies = selectedOp?.appliesTo || []
                                const isArray = isArrayApplies(applies)
                                // const isNumber = applies.includes('number') && !isArray

                                if (isArray) {
                                  return (
                                    <FormItem className="col-span-1">
                                      <FormLabel className="text-xs font-medium text-gray-600">
                                        Values (multi)
                                      </FormLabel>
                                      <div className="space-y-2">
                                        <div className="flex gap-2">
                                          <FormField
                                            control={form.control}
                                            name="roleNameFromList"
                                            render={({ field }) => (
                                              <select
                                                {...field}
                                                disabled={roleManualHas}
                                                className="flex h-9 flex-1 rounded-md border border-gray-300 bg-white px-2 text-sm disabled:opacity-50"
                                              >
                                                <option value="">-- chọn vai trò --</option>
                                                {(rolesResp || []).map((r) => (
                                                  <option key={r.id} value={r.name}>
                                                    {r.name}
                                                  </option>
                                                ))}
                                              </select>
                                            )}
                                          />
                                          <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                              const sel = form.getValues('roleNameFromList')
                                              if (sel) {
                                                addArrayValue('roleValues', String(sel), 'list')
                                                form.setValue('roleNameFromList', '')
                                              }
                                            }}
                                            disabled={roleManualHas}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <Input
                                          placeholder="Hoặc nhập thủ công (Enter để thêm)"
                                          value={roleArrayInput}
                                          onChange={(e) => setRoleArrayInput(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ',') {
                                              e.preventDefault()
                                              const val = (e.target as HTMLInputElement).value
                                                .trim()
                                                .replace(/,$/, '')
                                              if (val) {
                                                addArrayValue('roleValues', val, 'manual')
                                                setRoleArrayInput('')
                                              }
                                            }
                                          }}
                                          className="h-9 text-sm"
                                        />
                                        <div className="flex flex-wrap gap-1.5">
                                          {(roleValuesWatch || []).map((v: string) => {
                                            const isManual = roleValuesManual.includes(v)
                                            const strike = !isManual && roleTyping
                                            return (
                                              <span
                                                key={v}
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                                  strike
                                                    ? 'bg-gray-200 text-gray-400 line-through'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                              >
                                                {v}
                                                <button
                                                  type="button"
                                                  onClick={() => removeArrayValue('roleValues', v)}
                                                  className="hover:text-red-600"
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </span>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    </FormItem>
                                  )
                                }

                                // Single value
                                return (
                                  <>
                                    <div className="col-span-1 space-y-2">
                                      <FormField
                                        control={form.control}
                                        name="roleNameFromList"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-xs font-medium text-gray-600">
                                              Role (từ danh sách)
                                            </FormLabel>
                                            <FormControl>
                                              <select
                                                {...field}
                                                disabled={roleSelectDisabled}
                                                onChange={(e) => {
                                                  field.onChange(e.target.value)
                                                  if (e.target.value)
                                                    form.setValue('roleNameManual', '')
                                                }}
                                                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm disabled:opacity-50"
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
                                            <FormLabel className="text-xs font-medium text-gray-600">
                                              Role (nhập thủ công)
                                            </FormLabel>
                                            <FormControl>
                                              <Input
                                                {...field}
                                                type="text"
                                                placeholder="Hoặc nhập thủ công"
                                                onChange={(e) => {
                                                  const v = e.target.value
                                                  field.onChange(v)
                                                  if (String(v).trim().length > 0) {
                                                    form.setValue('roleNameFromList', '')
                                                  }
                                                }}
                                                className="h-9 text-sm"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
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
                                    <FormItem className="col-span-1">
                                      <FormLabel className="text-xs font-medium text-gray-600">
                                        Role level (multi)
                                      </FormLabel>
                                      <div className="space-y-2">
                                        <div className="flex gap-2">
                                          <select
                                            id="roleLevelSelect"
                                            disabled={roleLevelManualHas}
                                            className="flex h-9 flex-1 rounded-md border border-gray-300 bg-white px-2 text-sm disabled:opacity-50"
                                          >
                                            <option value="">-- chọn level --</option>
                                            {Array.from({ length: 10 }).map((_, i) => (
                                              <option key={i + 1} value={i + 1}>
                                                {i + 1}
                                              </option>
                                            ))}
                                          </select>
                                          <Button
                                            type="button"
                                            size="sm"
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
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <Input
                                          placeholder="Hoặc nhập số level (Enter)"
                                          type="number"
                                          value={roleLevelInput}
                                          onChange={(e) => setRoleLevelInput(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault()
                                              const val = (
                                                e.target as HTMLInputElement
                                              ).value.trim()
                                              if (val) {
                                                addArrayValue('roleValues', val, 'manual')
                                                setRoleLevelInput('')
                                              }
                                            }
                                          }}
                                          className="h-9 text-sm"
                                        />
                                        <div className="flex flex-wrap gap-1.5">
                                          {(roleValuesWatch || []).map((v: string) => {
                                            const isManual = roleValuesManual.includes(v)
                                            const strike = !isManual && roleLevelTyping
                                            return (
                                              <span
                                                key={v}
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                                  strike
                                                    ? 'bg-gray-200 text-gray-400 line-through'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                              >
                                                {v}
                                                <button
                                                  type="button"
                                                  onClick={() => removeArrayValue('roleValues', v)}
                                                  className="hover:text-red-600"
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </span>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    </FormItem>
                                  )
                                }

                                // Single level
                                return (
                                  <FormField
                                    control={form.control}
                                    name="roleLevel"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-medium text-gray-600">
                                          Role level
                                        </FormLabel>
                                        <FormControl>
                                          <select
                                            {...field}
                                            value={String(field.value || '')}
                                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                                          >
                                            <option value="">Chọn level</option>
                                            {Array.from({ length: 10 }).map((_, i) => (
                                              <option key={i + 1} value={i + 1}>
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
                      )}

                      {/* DEPARTMENT SECTION */}
                      {includeDepartment && (
                        <div className="mt-4 space-y-4 rounded-lg border border-emerald-200 bg-white/70 p-5">
                          <h4 className="flex items-center gap-2 font-semibold text-emerald-700">
                            <Building2 className="h-4 w-4" />
                            Department Configuration
                          </h4>

                          <div className="grid grid-cols-3 gap-4">
                            {/* Match By */}
                            <FormField
                              control={form.control}
                              name="deptMatchBy"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium text-gray-600">
                                    Match by
                                  </FormLabel>
                                  <FormControl>
                                    <select
                                      {...field}
                                      className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                    >
                                      <option value="name">📛 Name</option>
                                      <option value="code">🔖 Code</option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Operator */}
                            <FormField
                              control={form.control}
                              name="deptOperator"
                              render={({ field }) => {
                                const filteredOps = deptOperators || filterOperatorsByType('string')
                                return (
                                  <FormItem>
                                    <FormLabel className="text-xs font-medium text-gray-600">
                                      Operator
                                    </FormLabel>
                                    <FormControl>
                                      <select
                                        {...field}
                                        className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                      >
                                        <option value="">-- chọn --</option>
                                        {filteredOps.map((op) => (
                                          <option key={op.name} value={op.name}>
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

                            {/* Value */}
                            {deptMatchBy === 'name' &&
                              (() => {
                                const selectedOp = getOperatorByName(form.getValues('deptOperator'))
                                const applies = selectedOp?.appliesTo || []
                                const isArray = isArrayApplies(applies)

                                if (isArray) {
                                  return (
                                    <FormItem className="col-span-1">
                                      <FormLabel className="text-xs font-medium text-gray-600">
                                        Values (multi)
                                      </FormLabel>
                                      <div className="space-y-2">
                                        <div className="flex gap-2">
                                          <FormField
                                            control={form.control}
                                            name="deptNameFromList"
                                            render={({ field }) => (
                                              <select
                                                {...field}
                                                disabled={deptManualHas}
                                                className="flex h-9 flex-1 rounded-md border border-gray-300 bg-white px-2 text-sm disabled:opacity-50"
                                              >
                                                <option value="">-- chọn bộ phận --</option>
                                                {(deptsResp || []).map((d) => (
                                                  <option key={d.id} value={d.name}>
                                                    {d.name}
                                                  </option>
                                                ))}
                                              </select>
                                            )}
                                          />
                                          <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                              const sel = form.getValues('deptNameFromList')
                                              if (sel) {
                                                addArrayValue('deptValues', String(sel), 'list')
                                                form.setValue('deptNameFromList', '')
                                              }
                                            }}
                                            disabled={deptManualHas}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <Input
                                          placeholder="Hoặc nhập thủ công (Enter)"
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
                                          className="h-9 text-sm"
                                        />
                                        <div className="flex flex-wrap gap-1.5">
                                          {(deptValuesWatch || []).map((v: string) => {
                                            const isManual = deptValuesManual.includes(v)
                                            const strike = !isManual && deptTyping
                                            return (
                                              <span
                                                key={v}
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                                  strike
                                                    ? 'bg-gray-200 text-gray-400 line-through'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                              >
                                                {v}
                                                <button
                                                  type="button"
                                                  onClick={() => removeArrayValue('deptValues', v)}
                                                  className="hover:text-red-600"
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </span>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    </FormItem>
                                  )
                                }

                                // Single value
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
                                          <FormLabel className="text-xs font-medium text-gray-600">
                                            Department (từ danh sách)
                                          </FormLabel>
                                          <FormControl>
                                            <select
                                              {...field}
                                              disabled={deptSelectDisabled}
                                              onChange={(e) => {
                                                field.onChange(e.target.value)
                                                if (e.target.value)
                                                  form.setValue('deptNameManual', '')
                                              }}
                                              className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm disabled:opacity-50"
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
                                          <FormLabel className="text-xs font-medium text-gray-600">
                                            Department (nhập thủ công)
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              placeholder="Hoặc nhập thủ công"
                                              onChange={(e) => {
                                                const v = e.target.value
                                                field.onChange(v)
                                                if (String(v).trim().length > 0) {
                                                  form.setValue('deptNameFromList', '')
                                                }
                                              }}
                                              className="h-9 text-sm"
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
                                    <FormLabel className="text-xs font-medium text-gray-600">
                                      Department code
                                    </FormLabel>
                                    <FormControl>
                                      <select
                                        {...field}
                                        className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
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
                      )}
                    </>
                  )
                })()}
              </div>

              {/* SECTION: Resource */}
              <div className="space-y-4 rounded-xl border-2 border-amber-100 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Resource (Tài nguyên)</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="resourceOperator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Resource Operator
                        </FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                          >
                            <option value="">-- chọn --</option>
                            {(filterOperatorsByType('string') || []).map((op) => (
                              <option key={op.name} value={op.name}>
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Resource Type
                        </FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                          >
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
                            {resourceTypes.map((r: Record<string, unknown>) => {
                              const key = String(r.id ?? r.name)
                              const name = String(r.name ?? '')
                              return (
                                <option key={key} value={name}>
                                  {name}
                                </option>
                              )
                            })}
                          </select>
                        </FormControl>
                        {resourceTypesError && (
                          <p className="mt-1 text-xs text-red-600">
                            Failed to load resource types.{' '}
                            <button
                              type="button"
                              onClick={() => refetchResourceTypes()}
                              className="font-medium underline hover:text-red-800"
                            >
                              Retry
                            </button>
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* SECTION: Conditions */}
              <div className="space-y-4 rounded-xl border-2 border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/30 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Conditions (Điều kiện bổ sung)
                  </h3>
                </div>

                {conditionsLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading conditions...
                  </div>
                )}
                {conditionsError && (
                  <div className="text-sm text-red-600">
                    Failed to load conditions.{' '}
                    <button
                      type="button"
                      onClick={() => refetchConditions()}
                      className="font-medium underline hover:text-red-800"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {(conditionsResp || []).map((c: PolicyCondition) => {
                    const cid = String(c.id)
                    const dtype = String(c.dataType || 'string')
                    const ops =
                      filterOperatorsByType(dtype === 'number' ? 'number' : 'string') || []
                    const sel = selectedConditions[cid]

                    const cname = String(c.name ?? '')
                    const cdesc = c.description ? String(c.description) : undefined

                    return (
                      <div
                        key={cid}
                        className="space-y-3 rounded-lg border border-purple-200 bg-white/60 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={cid in selectedConditions}
                            onCheckedChange={() => toggleCondition(cid)}
                            className="mt-1 data-[state=checked]:bg-purple-600"
                          />
                          <div className="flex-1">
                            <label className="cursor-pointer font-medium text-gray-800">
                              {cname}
                            </label>
                            {cdesc && <p className="mt-0.5 text-xs text-gray-500">{cdesc}</p>}
                          </div>
                        </div>

                        {sel && (
                          <div className="ml-7 grid grid-cols-2 gap-3">
                            <select
                              value={sel.operator || ''}
                              onChange={(e) => setConditionOperator(cid, e.target.value)}
                              className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                            >
                              {ops.map((op) => (
                                <option key={op.name} value={op.name}>
                                  {formatOperatorLabel(op)}
                                </option>
                              ))}
                            </select>

                            {dtype === 'datetime' ? (
                              <DateTimeLocalPicker
                                value={sel.value || ''}
                                onChange={(v) => setConditionValue(cid, v)}
                                onISOChange={(iso) => setConditionValue(cid, iso ?? '')}
                                placeholder="YYYY-MM-DDThh:mm"
                                className="h-9"
                              />
                            ) : dtype === 'number' ? (
                              <Input
                                type="number"
                                value={sel.value || ''}
                                onChange={(e) => setConditionValue(cid, e.target.value)}
                                placeholder="Số"
                                className="h-9"
                              />
                            ) : (
                              <Input
                                type="text"
                                value={sel.value || ''}
                                onChange={(e) => setConditionValue(cid, e.target.value)}
                                placeholder={
                                  cname === 'ipAddress'
                                    ? 'Ví dụ: 192.168.1.1, 2001:0db8::1'
                                    : 'Chuỗi'
                                }
                                title={
                                  cname === 'ipAddress'
                                    ? 'Cho phép nhiều IP, cách nhau bằng dấu phẩy. Hỗ trợ IPv4 và IPv6'
                                    : undefined
                                }
                                className="h-9"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Condition errors */}
                {Object.entries(conditionErrors || {}).map(([id, err]) =>
                  err ? (
                    <div
                      key={id}
                      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                      <p className="text-sm text-red-700">{err}</p>
                    </div>
                  ) : null
                )}
                {submitError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                )}
              </div>
            </fieldset>
          </form>
        </Form>
      </SystemModalLayout>
    </Dialog>
  )
}
