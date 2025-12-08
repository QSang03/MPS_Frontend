import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Copy, Loader2, RefreshCw } from 'lucide-react'
import type { Policy, PolicyDraftInput, DraftChecklistItem } from '@/types/policies'
import type { PolicyBlueprint } from '@/types/policies'
import { stringifyPolicyPreview } from '@/lib/policies/policy-form.utils'
import { SubjectRuleBuilder } from './RuleBuilder/SubjectRuleBuilder'
import { ResourceRuleBuilder } from './RuleBuilder/ResourceRuleBuilder'
import { ConditionRuleBuilder } from './RuleBuilder/ConditionRuleBuilder'
import { policyObjectToRuleBuilderValue } from '../_utils/rule-builder-converters'
import { ruleBuilderValueToPolicyObject } from '../_utils/rule-builder-converters'
import { createRuleBuilderValue, createRuleNode } from '../_types/rule-builder'
import type { RuleBuilderValue, RuleGroup } from '../_types/rule-builder'
import { validatePolicyGuardrails } from '../_utils/guardrails'
import { InlineGuardrailWarning } from './Guardrails/InlineGuardrailWarning'
import { usePolicyCatalogsCache } from '../_hooks/usePolicyCatalogsCache'
import { useLocale } from '@/components/providers/LocaleProvider'

interface PolicyDraftPanelProps {
  draft: PolicyDraftInput
  onChange: (draft: PolicyDraftInput) => void
  policyPreview: Partial<Policy>
  checklist: DraftChecklistItem[]
  blueprint?: PolicyBlueprint | null
  isBlueprintLoading?: boolean
  selectedRole?: string
  onRefreshBlueprint?: () => void
}

const ACTION_SUGGESTIONS = ['read', 'create', 'update', 'delete', '*']

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export function PolicyDraftPanel({
  draft,
  onChange,
  policyPreview,
  checklist,
  blueprint,
  isBlueprintLoading = false,
  selectedRole,
  onRefreshBlueprint,
}: PolicyDraftPanelProps) {
  const { t } = useLocale()
  const [actionInput, setActionInput] = useState('')

  // Use ref to always have the latest draft value
  const draftRef = useRef(draft)
  const isInternalUpdateRef = useRef(false) // Track if update is from internal state change

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  const policyPreviewString = useMemo(() => stringifyPolicyPreview(policyPreview), [policyPreview])

  // Store RuleBuilderValue state separately to avoid losing rules with empty fields
  const [subjectValueState, setSubjectValueState] = useState<RuleBuilderValue>(() => {
    if (draft.rawSubject && Object.keys(draft.rawSubject).length > 0) {
      return policyObjectToRuleBuilderValue(draft.rawSubject)
    }
    return createRuleBuilderValue('$and')
  })

  const [resourceValueState, setResourceValueState] = useState<RuleBuilderValue>(() => {
    if (draft.rawResource && Object.keys(draft.rawResource).length > 0) {
      return policyObjectToRuleBuilderValue(draft.rawResource)
    }
    return createRuleBuilderValue('$and')
  })

  // Sync with draft when it changes externally (e.g., when loading a policy)
  // Only sync if the update is NOT from internal state change
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false
      return // Skip sync if update is from internal state change
    }

    if (draft.rawSubject && Object.keys(draft.rawSubject).length > 0) {
      const newValue = policyObjectToRuleBuilderValue(draft.rawSubject)
      // Defer state update to avoid synchronous setState inside effect
      Promise.resolve().then(() => {
        setSubjectValueState((prev) => {
          // Only update if structure is significantly different
          const prevRulesStr = JSON.stringify(prev.rules.map((r) => ({ id: r.id, field: r.field })))
          const newRulesStr = JSON.stringify(
            newValue.rules.map((r) => ({ id: r.id, field: r.field }))
          )
          if (
            prevRulesStr !== newRulesStr ||
            JSON.stringify(prev.groups) !== JSON.stringify(newValue.groups)
          ) {
            return newValue
          }
          return prev
        })
      })
    } else if (!draft.rawSubject || Object.keys(draft.rawSubject).length === 0) {
      // Only reset if we have rules in state (meaning it's an external reset)
      Promise.resolve().then(() => {
        setSubjectValueState((prev) => {
          if (prev.rules.length > 0 || prev.groups.length > 0) {
            return createRuleBuilderValue('$and')
          }
          return prev
        })
      })
    }
  }, [draft.rawSubject])

  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false
      return // Skip sync if update is from internal state change
    }

    if (draft.rawResource && Object.keys(draft.rawResource).length > 0) {
      const newValue = policyObjectToRuleBuilderValue(draft.rawResource)
      // Defer state update to avoid synchronous setState inside effect
      Promise.resolve().then(() => {
        setResourceValueState((prev) => {
          // Only update if structure is significantly different
          const prevRulesStr = JSON.stringify(prev.rules.map((r) => ({ id: r.id, field: r.field })))
          const newRulesStr = JSON.stringify(
            newValue.rules.map((r) => ({ id: r.id, field: r.field }))
          )
          if (
            prevRulesStr !== newRulesStr ||
            JSON.stringify(prev.groups) !== JSON.stringify(newValue.groups)
          ) {
            return newValue
          }
          return prev
        })
      })
    } else if (!draft.rawResource || Object.keys(draft.rawResource).length === 0) {
      // Only reset if we have rules in state (meaning it's an external reset)
      Promise.resolve().then(() => {
        setResourceValueState((prev) => {
          if (prev.rules.length > 0 || prev.groups.length > 0) {
            return createRuleBuilderValue('$and')
          }
          return prev
        })
      })
    }
  }, [draft.rawResource])

  const subjectValue = subjectValueState
  const resourceValue = resourceValueState

  const conditionValue = useMemo<RuleBuilderValue>(() => {
    // Convert conditionGroups to RuleBuilderValue
    if (draft.conditionGroups && draft.conditionGroups.length > 0) {
      const firstGroup = draft.conditionGroups[0]
      if (!firstGroup) return createRuleBuilderValue('$and')
      const rules = firstGroup.conditions.map((c) => ({
        id: c.id || generateId(),
        field: c.field,
        operator: c.operator,
        value: c.value,
      }))
      return {
        gate: firstGroup.gate,
        rules,
        groups: draft.conditionGroups.slice(1).map((g) => ({
          id: g.id,
          gate: g.gate,
          rules: g.conditions.map((c) => ({
            id: c.id || generateId(),
            field: c.field,
            operator: c.operator,
            value: c.value,
          })),
          groups: [],
        })),
      }
    }
    return createRuleBuilderValue('$and')
  }, [draft.conditionGroups])

  // Get selected resource type from resourceValue
  const selectedResourceType = useMemo(() => {
    const typeRule = resourceValue.rules.find((r) => r.field === 'type')
    return typeRule?.value ? String(typeRule.value) : ''
  }, [resourceValue])

  // Get guardrail warnings - need to get resourceTypes from cache
  const { resourceTypes } = usePolicyCatalogsCache()
  const guardrailWarnings = useMemo(() => {
    return validatePolicyGuardrails({
      effect: draft.effect,
      subjectValue,
      resourceValue,
      resourceTypes,
      selectedResourceType,
    })
  }, [draft.effect, subjectValue, resourceValue, resourceTypes, selectedResourceType])

  const subjectGuardrailWarnings = useMemo(
    () => guardrailWarnings.filter((warning) => warning.field?.startsWith('subject.')),
    [guardrailWarnings]
  )

  const resourceGuardrailWarnings = useMemo(
    () => guardrailWarnings.filter((warning) => warning.field?.startsWith('resource.')),
    [guardrailWarnings]
  )

  const generalGuardrailWarnings = useMemo(
    () => guardrailWarnings.filter((warning) => !warning.field),
    [guardrailWarnings]
  )

  // Handle Rule Builder changes
  const handleSubjectChange = useCallback(
    (value: RuleBuilderValue) => {
      console.log('[PolicyDraftPanel] handleSubjectChange called', {
        rulesCount: value.rules.length,
        value,
      })
      // Mark as internal update to prevent sync loop
      isInternalUpdateRef.current = true
      // Update local state immediately to keep UI in sync
      setSubjectValueState(value)
      // Convert to policy object (may be empty if rules have no field/operator)
      const rawSubject = ruleBuilderValueToPolicyObject(value)
      console.log('[PolicyDraftPanel] Calling onChange with rawSubject', { rawSubject })
      onChange({ ...draftRef.current, rawSubject })
    },
    [onChange]
  )

  const handleResourceChange = useCallback(
    (value: RuleBuilderValue) => {
      console.log('[PolicyDraftPanel] handleResourceChange called', {
        rulesCount: value.rules.length,
        value,
      })
      // Mark as internal update to prevent sync loop
      isInternalUpdateRef.current = true
      // Update local state immediately to keep UI in sync
      setResourceValueState(value)
      // Convert to policy object (may be empty if rules have no field/operator)
      const rawResource = ruleBuilderValueToPolicyObject(value)
      console.log('[PolicyDraftPanel] Calling onChange with rawResource', { rawResource })
      onChange({ ...draftRef.current, rawResource })
    },
    [onChange]
  )

  const handleAddManagedCustomersCondition = useCallback(() => {
    if (ruleBuilderValueHasField(subjectValue, 'user.attributes.managedCustomers')) return
    const managedRule = createRuleNode()
    managedRule.field = 'user.attributes.managedCustomers'
    managedRule.operator = '$exists'
    managedRule.value = true
    handleSubjectChange({
      ...subjectValue,
      rules: [...subjectValue.rules, managedRule],
    })
  }, [subjectValue, handleSubjectChange])

  const handleAddResourceCustomerCondition = useCallback(() => {
    if (ruleBuilderValueHasField(resourceValue, 'customerId')) return
    const customerRule = createRuleNode()
    customerRule.field = 'customerId'
    customerRule.operator = '$eq'
    customerRule.value = '{{user.customerId}}'
    handleResourceChange({
      ...resourceValue,
      rules: [...resourceValue.rules, customerRule],
    })
  }, [resourceValue, handleResourceChange])

  const warningAutoFixMap = useMemo(
    () => ({
      'customer-manager-missing-managed-customers': handleAddManagedCustomersCondition,
      'tenant-isolation-missing': handleAddResourceCustomerCondition,
    }),
    [handleAddManagedCustomersCondition, handleAddResourceCustomerCondition]
  )

  const updateDraft = useCallback(
    (patch: Partial<PolicyDraftInput>) => {
      onChange({ ...draft, ...patch })
    },
    [draft, onChange]
  )

  const handleConditionChange = useCallback(
    (value: RuleBuilderValue) => {
      // Convert RuleBuilderValue back to conditionGroups format
      const conditionGroups = [
        {
          id: generateId(),
          gate: value.gate,
          conditions: value.rules.map((r) => ({
            id: r.id,
            field: r.field,
            operator: r.operator,
            value: r.value,
          })),
        },
        ...value.groups.map((g) => ({
          id: g.id,
          gate: g.gate,
          conditions: g.rules.map((r) => ({
            id: r.id,
            field: r.field,
            operator: r.operator,
            value: r.value,
          })),
        })),
      ]
      onChange({ ...draftRef.current, conditionGroups })
    },
    [onChange]
  )

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

  const handleCopyPreview = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(policyPreviewString)
      toast.success(t('policies.draft.preview.copy_success'))
    } catch (error) {
      console.error('[PolicyDraftPanel] copy preview error', error)
      toast.error(t('policies.draft.preview.copy_error'))
    }
  }, [policyPreviewString, t])

  return (
    <Card className="rounded-2xl border-2 border-slate-100 p-6 shadow-xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            {t('policies.draft.title')}
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{t('policies.draft.subtitle')}</h2>
          <p className="text-sm text-slate-500">{t('policies.draft.description')}</p>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-[var(--brand-600)] uppercase">
                  {t('policies.draft.metadata.title')}
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {t('policies.draft.metadata.label')}
                </h3>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="policy-name">{t('policies.draft.metadata.name')}</Label>
                <Input
                  id="policy-name"
                  value={draft.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  placeholder={t('policies.draft.metadata.name_placeholder')}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('policies.draft.metadata.effect')}</Label>
                <Select
                  value={draft.effect}
                  onValueChange={(value) =>
                    updateDraft({ effect: value as PolicyDraftInput['effect'] })
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={t('policies.draft.metadata.effect_placeholder')} />
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
                <Label>{t('policies.draft.metadata.actions')}</Label>
                <p className="text-xs text-slate-500">
                  {t('policies.draft.metadata.actions_suggestions')}:{' '}
                  {ACTION_SUGGESTIONS.slice(0, 4).join(', ')}{' '}
                  <span className="text-slate-400">(+ custom)</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {draft.actions.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {t('policies.draft.metadata.actions_empty')}
                  </p>
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
                  placeholder={t('policies.draft.metadata.action_input_placeholder')}
                  className="rounded-xl"
                />
                <Button type="button" onClick={handleAddAction} className="rounded-xl">
                  {t('policies.draft.metadata.add_action')}
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

            {generalGuardrailWarnings.length > 0 && (
              <div className="mt-4 space-y-3">
                {generalGuardrailWarnings.map((warning) => (
                  <InlineGuardrailWarning key={warning.id} warning={warning} />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-sm">
            <Tabs defaultValue="subject" className="space-y-4">
              <div>
                <TabsList className="bg-muted inline-flex h-9 items-center justify-start rounded-lg p-1">
                  <TabsTrigger
                    value="subject"
                    className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
                  >
                    {t('policies.draft.tabs.subject')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="resource"
                    className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
                  >
                    {t('policies.draft.tabs.resource')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="conditions"
                    className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
                  >
                    {t('policies.draft.tabs.conditions')}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="subject" className="pointer-events-auto space-y-5">
                <div className="space-y-4">
                  <SubjectRuleBuilder value={subjectValue} onChange={handleSubjectChange} />
                  {/* Show guardrail warnings for subject */}
                  {subjectGuardrailWarnings.map((warning) => (
                    <InlineGuardrailWarning
                      key={warning.id}
                      warning={warning}
                      onAutoFix={warningAutoFixMap[warning.id as keyof typeof warningAutoFixMap]}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="resource" className="pointer-events-auto space-y-5">
                <div className="space-y-4">
                  <ResourceRuleBuilder value={resourceValue} onChange={handleResourceChange} />
                  {/* Show guardrail warnings for resource */}
                  {resourceGuardrailWarnings.map((warning) => (
                    <InlineGuardrailWarning
                      key={warning.id}
                      warning={warning}
                      onAutoFix={warningAutoFixMap[warning.id as keyof typeof warningAutoFixMap]}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="conditions" className="pointer-events-auto space-y-5">
                <div className="space-y-4">
                  <ConditionRuleBuilder value={conditionValue} onChange={handleConditionChange} />
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                  {t('policies.draft.checklist.title')}
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {t('policies.draft.checklist.label')}
                </h3>
              </div>
              <Badge variant="outline" className="rounded-full text-xs">
                {checklist.filter((item) => item.passed).length}/{checklist.length}{' '}
                {t('policies.draft.checklist.done')}
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
                  {t('policies.draft.preview.title')}
                </p>
                <h3 className="text-lg font-semibold text-white">
                  {t('policies.draft.preview.label')}
                </h3>
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

          <section className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-[var(--brand-600)] uppercase">
                  {t('policies.draft.blueprint.title')}
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {t('policies.draft.blueprint.label')}
                </h3>
              </div>
              {selectedRole && onRefreshBlueprint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRefreshBlueprint()}
                  className="rounded-full"
                  disabled={isBlueprintLoading}
                >
                  <RefreshCw
                    className={`mr-1 h-4 w-4 ${isBlueprintLoading ? 'animate-spin' : ''}`}
                  />
                  {t('policies.draft.blueprint.refresh')}
                </Button>
              )}
            </div>
            {!selectedRole && (
              <p className="mt-4 text-sm text-slate-500">{t('policies.draft.blueprint.no_role')}</p>
            )}
            {selectedRole && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-xs tracking-wide text-slate-500 uppercase">
                      {t('policies.draft.blueprint.current_role')}
                    </p>
                    <p className="text-base font-semibold text-slate-900">{selectedRole}</p>
                  </div>
                  {isBlueprintLoading && (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  )}
                </div>
                {!isBlueprintLoading && blueprint && (
                  <div className="space-y-3">
                    {blueprint.summary && (
                      <p className="text-sm text-slate-600">{blueprint.summary}</p>
                    )}
                    {blueprint.recommendedGuardrails &&
                      blueprint.recommendedGuardrails.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                            {t('policies.draft.blueprint.recommended_guardrails')}
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600">
                            {blueprint.recommendedGuardrails.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    {blueprint.samplePolicies && blueprint.samplePolicies.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                          {t('policies.draft.blueprint.sample_policies')}
                        </p>
                        <div className="mt-2 space-y-2">
                          {blueprint.samplePolicies.map((policy) => (
                            <div
                              key={policy.id}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-800">
                                  {policy.name}
                                </p>
                                <Badge variant="secondary" className="rounded-full text-[10px]">
                                  {policy.effect}
                                </Badge>
                              </div>
                              {policy.actions?.length ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  {t('policies.draft.blueprint.actions')}:{' '}
                                  {policy.actions.join(', ')}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {blueprint.missingPatterns && blueprint.missingPatterns.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                          {t('policies.draft.blueprint.missing_patterns')}
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600">
                          {blueprint.missingPatterns.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {!isBlueprintLoading && selectedRole && !blueprint && (
                  <p className="text-sm text-slate-500">
                    {t('policies.draft.blueprint.not_found')}
                  </p>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </Card>
  )
}

function ruleBuilderValueHasField(value: RuleBuilderValue, field: string): boolean {
  if (value.rules.some((rule) => rule.field === field)) {
    return true
  }
  return value.groups.some((group) => ruleGroupHasField(group, field))
}

function ruleGroupHasField(group: RuleGroup, field: string): boolean {
  if (group.rules.some((rule) => rule.field === field)) {
    return true
  }
  return group.groups.some((nestedGroup) => ruleGroupHasField(nestedGroup, field))
}
