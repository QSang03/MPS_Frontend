'use client'

import { useMemo, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { policyAssistantService } from '@/lib/api/services/policy-assistant.service'
import { policiesClientService } from '@/lib/api/services/policies-client.service'
import type { PolicyAssistantAnalysis, PolicyDraftInput } from '@/types/policies'
import {
  draftInputToPolicy,
  buildPolicyPayload,
  buildDraftChecklist,
} from '@/lib/policies/policy-form.utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { RoleBuilderPanel } from './RoleBuilderPanel'
import { PolicyDraftPanel } from './PolicyDraftPanel'
import { AssistantPanel } from './AssistantPanel'
import { CatalogSidebar } from './CatalogSidebar'
import { usePolicyCatalogs } from '../_hooks/usePolicyCatalogs'

const defaultDraft: PolicyDraftInput = {
  name: '',
  effect: 'ALLOW',
  actions: [],
  notes: '',
  selectedRole: 'system-admin',
  departmentScope: 'none',
  departmentValues: [],
  includeManagedCustomers: false,
  managedCustomers: [],
  customerScope: 'all',
  customerIds: [],
  resourceType: '',
  rawSubject: {},
  rawResource: {},
  subjectAttributes: [],
  resourceFilters: [],
  conditionGroups: [
    {
      id: 'group-1',
      gate: '$and',
      conditions: [],
    },
  ],
}

export function PolicyWorkspace() {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState('system-admin')
  const [draft, setDraft] = useState<PolicyDraftInput>(defaultDraft)
  const [analysis, setAnalysis] = useState<PolicyAssistantAnalysis | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const {
    roles,
    resourceTypes,
    policyOperators,
    policyConditions,
    blueprint,
    catalogs,
    catalogsLoading,
    isBlueprintLoading,
    rolesError,
    refetchBlueprint,
  } = usePolicyCatalogs(selectedRole)

  const handleSelectRole = useCallback(
    (roleName: string) => {
      setSelectedRole(roleName)
      setAnalysis(null)
      setDraft((prev) => ({
        ...prev,
        selectedRole: roleName || prev.selectedRole,
      }))
    },
    [setDraft]
  )

  const handleDraftChange = useCallback((nextDraft: PolicyDraftInput) => {
    setDraft(nextDraft)
    setAnalysis(null)
  }, [])

  const checklist = useMemo(() => buildDraftChecklist(draft), [draft])

  const draftReady = useMemo(() => checklist.every((item) => item.passed), [checklist])

  const validateDraft = useCallback(() => {
    if (!draft.name.trim()) {
      toast.error('Vui lòng nhập tên policy')
      return false
    }
    if (draft.actions.length === 0) {
      toast.error('Policy cần ít nhất một action')
      return false
    }
    if (!draft.resourceType?.trim()) {
      toast.error('Vui lòng chọn resource type')
      return false
    }
    return true
  }, [draft])

  const handleAnalyze = useCallback(async () => {
    if (!validateDraft()) return
    setIsAnalyzing(true)
    try {
      const payload = draftInputToPolicy(draft)
      const result = await policyAssistantService.analyzeDraft(payload)
      setAnalysis(result)
      setAnalysisError(null)
      toast.success('Đã phân tích policy draft')
    } catch (error) {
      console.error('[PolicyWorkspace] analyze error', error)
      setAnalysis(null)
      const apiMessage = extractApiErrorMessage(error)
      setAnalysisError(apiMessage)
      toast.error(apiMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }, [draft, validateDraft])

  const handleCreatePolicy = useCallback(async () => {
    if (!validateDraft()) return
    const safe = analysis?.safeToCreate
    if (safe === false) {
      toast.error('Draft chưa an toàn để tạo, hãy xử lý conflict')
      return
    }
    setIsCreating(true)
    try {
      const policy = draftInputToPolicy(draft)
      const payload = buildPolicyPayload(policy, { role: selectedRole })
      await policiesClientService.createPolicy(payload)
      toast.success('Tạo policy thành công')
      setDraft(defaultDraft)
      setAnalysis(null)
      queryClient.invalidateQueries({ queryKey: ['policies'] })
    } catch (error) {
      console.error('[PolicyWorkspace] create policy error', error)
      toast.error('Không thể tạo policy')
    } finally {
      setIsCreating(false)
    }
  }, [analysis?.safeToCreate, draft, queryClient, selectedRole, validateDraft])

  const draftPreview = useMemo(() => draftInputToPolicy(draft), [draft])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1 shadow-2xl">
        <Card className="rounded-[calc(1.5rem-4px)] bg-white/90 p-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm tracking-widest text-indigo-500 uppercase">Policy Assistant</p>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý Policy thông minh</h1>
              <p className="text-gray-600">
                Xây policy ABAC an toàn với guardrail, phân tích conflict và test scenario realtime.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {rolesError ? (
        <div className="border-destructive/40 bg-destructive/5 text-destructive flex items-center gap-2 rounded-xl border p-4">
          <AlertCircle className="h-5 w-5" />
          <p>Không tải được danh sách role. Hãy thử tải lại trang.</p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <CatalogSidebar
          roles={roles}
          resourceTypes={resourceTypes}
          policyOperators={policyOperators}
          policyConditions={policyConditions}
          loading={catalogsLoading}
        />

        <div className="space-y-6">
          {catalogsLoading && roles.length === 0 ? (
            <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <RoleBuilderPanel
              roles={roles}
              selectedRole={selectedRole}
              onSelectRole={handleSelectRole}
              blueprint={blueprint || undefined}
              isBlueprintLoading={isBlueprintLoading}
              onRefreshBlueprint={refetchBlueprint}
            />
          )}

          <PolicyDraftPanel
            draft={draft}
            onChange={handleDraftChange}
            selectedRole={selectedRole}
            roles={roles}
            onSelectRole={handleSelectRole}
            blueprint={blueprint}
            policyPreview={draftPreview}
            catalogs={catalogs}
            catalogsLoading={catalogsLoading}
            checklist={checklist}
          />
        </div>

        <AssistantPanel
          analysis={analysis}
          analysisError={analysisError}
          isAnalyzing={isAnalyzing}
          isCreating={isCreating}
          onAnalyze={handleAnalyze}
          onCreate={handleCreatePolicy}
          safeToCreate={analysis?.safeToCreate ?? false}
          draftValid={draftReady}
        />
      </div>
    </div>
  )
}

const ANALYZE_DEFAULT_ERROR = 'Không phân tích được draft, vui lòng thử lại'

const extractApiErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data
    if (typeof data === 'string') return data
    if (data && typeof data === 'object') {
      const maybeRecord = data as Record<string, unknown>
      if (typeof maybeRecord.error === 'string') return maybeRecord.error
      if (typeof maybeRecord.message === 'string') return maybeRecord.message
    }
    if (typeof error.message === 'string') return error.message
  }
  if (error instanceof Error && error.message) return error.message
  return ANALYZE_DEFAULT_ERROR
}
