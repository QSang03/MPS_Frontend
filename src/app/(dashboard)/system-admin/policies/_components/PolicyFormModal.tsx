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
import { useQuery } from '@tanstack/react-query'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'
import { policiesClientService } from '@/lib/api/services/policies-client.service'
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
  includeDepartment: z.boolean().optional(),
  deptMatchBy: z.enum(['name', 'code']).optional(),
  deptOperator: z.string().optional(),
  deptValues: z.array(z.string()).optional(),
  deptUseList: z.boolean().optional(),
  deptNameManual: z.string().optional(),
  deptNameFromList: z.string().optional(),
  deptCodeFromList: z.string().optional(),
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
      resource: '',
      conditions: '',
    },
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
        resource: initialData.resource ? JSON.stringify(initialData.resource, null, 2) : '',
        conditions: initialData.conditions ? JSON.stringify(initialData.conditions, null, 2) : '',
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
        const deptNameKey = subj['department.name']
          ? 'department.name'
          : subj['attributes.department']
            ? 'attributes.department'
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
      form.reset(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, rolesResp, deptsResp])

  const handleSubmit = async (data: PolicyFormData) => {
    setIsLoading(true)
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
      <DialogContent
        className={
          initialData
            ? 'max-h-[80vh] !max-w-[80vw] overflow-auto'
            : 'max-h-[80vh] overflow-auto sm:max-w-[600px]'
        }
      >
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
                        <div className="grid grid-cols-3 gap-3">
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
                                filterOperatorsByType(roleMatchBy === 'name' ? 'string' : 'number')
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
                                                        <option value="">-- chọn vai trò --</option>
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
                                                    addArrayValue('roleValues', String(sel), 'list')
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
                                                onChange={(e) => setRoleArrayInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter' || e.key === ',') {
                                                    e.preventDefault()
                                                    const val = (e.target as HTMLInputElement).value
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
                                                    placeholder={isNumber ? 'Gõ số' : 'Gõ tên role'}
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
                        <div className="grid grid-cols-3 gap-3">
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
                                const selectedOp = getOperatorByName(form.getValues('deptOperator'))
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

            <FormField
              control={form.control}
              name="resource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource (JSON)</FormLabel>
                  <FormControl>
                    <textarea
                      className="input h-20 w-full resize-none rounded-md border p-2"
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
                      className="input h-20 w-full resize-none rounded-md border p-2"
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
