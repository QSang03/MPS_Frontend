export interface Policy {
  id: string
  customerId?: string | null
  name: string
  effect: 'ALLOW' | 'DENY' | string
  actions: string[]
  subject: Record<string, unknown>
  resource: Record<string, unknown>
  conditions: Record<string, unknown>
  createdAt?: string
}

export interface PolicyConditionInput {
  id?: string
  field: string
  operator: string
  value?: unknown
}

export type PolicyLogicalGate = '$and' | '$or'

export interface SubjectAttributeFilter {
  id: string
  field: string
  operator: string
  value?: unknown
  dataType: 'string' | 'number' | 'boolean' | 'array_string' | 'datetime'
  readOnly?: boolean
}

export interface ResourceFilterInput {
  id: string
  field: string
  operator: string
  value?: unknown
  dataType?: string
  fromSchema?: boolean
}

export interface ConditionGroupInput {
  id: string
  gate: PolicyLogicalGate
  conditions: PolicyConditionInput[]
}

export interface DraftChecklistItem {
  id: string
  label: string
  passed: boolean
  hint?: string
}

export interface PolicyTestScenario {
  subject: Record<string, unknown>
  action: string
  resource: Record<string, unknown>
  expected: 'ALLOW' | 'DENY' | string
}

export interface PolicyConflict {
  policy_name: string
  effect: 'ALLOW' | 'DENY' | string
  overlapping_actions?: string[]
  reasons?: string[]
  suggestions?: string[]
}

export interface PolicyAssistantAnalysis {
  summary?: string
  safeToCreate: boolean
  conflicts: PolicyConflict[]
  warnings?: string[]
  recommendations: string[]
  testScenarios: PolicyTestScenario[]
}

export interface PolicyBlueprintSamplePolicy {
  id: string
  name: string
  effect: 'ALLOW' | 'DENY' | string
  actions: string[]
  keySubjects?: string[]
  keyResources?: string[]
}

export interface PolicyBlueprint {
  roleName: string
  totalPolicies?: number
  samplePolicies?: PolicyBlueprintSamplePolicy[]
  recommendedGuardrails?: string[]
  missingPatterns?: string[]
  summary?: string
  template?: Partial<Policy>
}

export interface PolicyDraftInput {
  name: string
  effect: 'ALLOW' | 'DENY'
  actions: string[]
  rawSubject?: Record<string, unknown>
  rawResource?: Record<string, unknown>
  conditionGroups: ConditionGroupInput[]
}
