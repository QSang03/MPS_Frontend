'use client'

import { useMemo, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { policiesClientService } from '@/lib/api/services/policies-client.service'
import type { PolicyDraftInput } from '@/types/policies'
import {
  draftInputToPolicy,
  buildPolicyPayload,
  buildDraftChecklist,
} from '@/lib/policies/policy-form.utils'

import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { PolicyDraftPanel } from './PolicyDraftPanel'
import { AssistantPanel } from './AssistantPanel'
import { useAutoAnalyze } from '../_hooks/useAutoAnalyze'
import { policyToDraftInput } from '../_utils/policy-to-draft'
import type { Policy } from '@/types/policies'
import { Bot } from 'lucide-react'
import { useState } from 'react'
import { usePolicyCatalogs } from '../_hooks/usePolicyCatalogs'
import { useLocale } from '@/components/providers/LocaleProvider'

const defaultDraft: PolicyDraftInput = {
  name: '',
  effect: 'ALLOW',
  actions: [],
  rawSubject: {},
  rawResource: {},
  conditionGroups: [
    {
      id: 'group-1',
      gate: '$and',
      conditions: [],
    },
  ],
}

interface PolicyWorkspaceProps {
  initialPolicy?: Policy | null
  onPolicyCreated?: () => void
}

export function PolicyWorkspace({ initialPolicy, onPolicyCreated }: PolicyWorkspaceProps) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<PolicyDraftInput>(defaultDraft)
  const [isCreating, setIsCreating] = useState(false)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const { t } = useLocale()

  // Load initial policy if editing
  useEffect(() => {
    if (initialPolicy) {
      const draftFromPolicy = policyToDraftInput(initialPolicy)
      setDraft(draftFromPolicy)
    }
  }, [initialPolicy])

  const handleDraftChange = useCallback((nextDraft: PolicyDraftInput) => {
    setDraft(nextDraft)
  }, [])

  const checklist = useMemo(() => buildDraftChecklist(draft), [draft])

  const draftReady = useMemo(() => checklist.every((item) => item.passed), [checklist])

  // Convert draft to policy for auto-analyze
  const draftPolicy = useMemo(() => {
    if (!draft.name.trim() || draft.actions.length === 0) {
      return null
    }
    return draftInputToPolicy(draft)
  }, [draft])

  // Auto-analyze with debounce
  const {
    analysis,
    isAnalyzing,
    error: analysisError,
    manualAnalyze,
  } = useAutoAnalyze({
    draft: draftPolicy || {},
    enabled: draftReady,
    debounceMs: 2000,
    onAnalysisComplete: () => {
      // Analysis completed successfully
    },
    onError: (error) => {
      console.error('[PolicyWorkspace] auto-analyze error', error)
    },
  })

  const validateDraft = useCallback(() => {
    if (!draft.name.trim()) {
      toast.error(t('policies.validation.name_required'))
      return false
    }
    if (draft.actions.length === 0) {
      toast.error(t('policies.validation.action_required'))
      return false
    }
    // Check if resource has type
    const resource = draft.rawResource || {}
    if (!resource.type) {
      toast.error(t('policies.validation.resource_type_required'))
      return false
    }
    return true
  }, [draft, t])

  const handleAnalyze = useCallback(async () => {
    if (!validateDraft()) return
    manualAnalyze()
  }, [validateDraft, manualAnalyze])

  const handleCreatePolicy = useCallback(async () => {
    if (!validateDraft()) return
    // Hiển thị warning nếu có conflicts nhưng vẫn cho phép tạo
    const conflicts = analysis?.conflicts ?? []
    const hasConflicts = conflicts.length > 0
    const safe = analysis?.safeToCreate
    if (hasConflicts && safe === false) {
      // Hiển thị warning nhưng vẫn cho phép tạo
      toast.warning(t('policies.conflicts_warning', { count: conflicts.length }), {
        duration: 5000,
      })
    }
    setIsCreating(true)
    try {
      const policy = draftInputToPolicy(draft)
      const payload = buildPolicyPayload(policy)

      if (initialPolicy?.id) {
        // Update existing policy
        await policiesClientService.updatePolicy(initialPolicy.id, payload)
        toast.success(t('policies.update_success'))
      } else {
        // Create new policy
        await policiesClientService.createPolicy(payload)
        toast.success(t('policies.create_success'))
      }

      setDraft(defaultDraft)
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      onPolicyCreated?.()
    } catch (error) {
      console.error('[PolicyWorkspace] create policy error', error)
      toast.error(initialPolicy?.id ? t('policies.update_error') : t('policies.create_error'))
    } finally {
      setIsCreating(false)
    }
  }, [
    analysis?.conflicts,
    analysis?.safeToCreate,
    draft,
    queryClient,
    validateDraft,
    initialPolicy,
    onPolicyCreated,
    t,
  ])

  const draftPreview = useMemo(() => draftInputToPolicy(draft), [draft])
  const selectedRole = useMemo(
    () => getSelectedRoleFromSubject(draft.rawSubject),
    [draft.rawSubject]
  )
  const { blueprint, isBlueprintLoading, refetchBlueprint } = usePolicyCatalogs(selectedRole)
  const handleRefreshBlueprint = useCallback(() => {
    if (!selectedRole) return
    void refetchBlueprint()
  }, [selectedRole, refetchBlueprint])

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('page.policies.title')}</h1>
        </div>
        <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl border-[var(--brand-300)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-50)] text-[var(--brand-700)] shadow-md hover:from-[var(--brand-100)] hover:to-[var(--brand-100)]"
            >
              <Bot className="mr-2 h-5 w-5" />
              {t('policies.ai.title')}
            </Button>
          </DialogTrigger>
          <SystemModalLayout
            title={t('policies.ai.title')}
            description={t('policies.ai.description')}
            icon={Bot}
            variant="view"
            maxWidth="!max-w-[75vw]"
          >
            <AssistantPanel
              analysis={analysis}
              analysisError={analysisError || null}
              isAnalyzing={isAnalyzing}
              isCreating={isCreating}
              onAnalyze={handleAnalyze}
              onCreate={handleCreatePolicy}
              safeToCreate={analysis?.safeToCreate ?? false}
              draftValid={draftReady}
              draft={draftPolicy || undefined}
              onUseSuggestion={(suggestedPolicy) => {
                // Convert suggested policy to draft
                const suggestedDraft = policyToDraftInput(suggestedPolicy as Policy)
                setDraft(suggestedDraft)
                toast.success(t('policies.ai.applied'))
              }}
            />
          </SystemModalLayout>
        </Dialog>
      </div>

      <PolicyDraftPanel
        draft={draft}
        onChange={handleDraftChange}
        policyPreview={draftPreview}
        checklist={checklist}
        blueprint={selectedRole ? blueprint : null}
        isBlueprintLoading={isBlueprintLoading}
        selectedRole={selectedRole}
        onRefreshBlueprint={selectedRole ? handleRefreshBlueprint : undefined}
      />
    </div>
  )
}

function getSelectedRoleFromSubject(subject?: Record<string, unknown>): string {
  if (!subject) return ''
  const condition = subject['role.name']
  if (!condition || typeof condition !== 'object') return ''
  const roleCondition = condition as Record<string, unknown>
  const eqValue = roleCondition['$eq']
  if (typeof eqValue === 'string' && eqValue.trim()) {
    return eqValue
  }
  const candidates = roleCondition['$in']
  if (Array.isArray(candidates) && candidates.length === 1 && typeof candidates[0] === 'string') {
    return candidates[0]
  }
  return ''
}
