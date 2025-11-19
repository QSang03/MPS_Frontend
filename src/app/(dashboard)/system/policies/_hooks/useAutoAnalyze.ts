import { useState, useEffect, useCallback, useRef } from 'react'
import { policyAssistantService } from '@/lib/api/services/policy-assistant.service'
import type { Policy, PolicyAssistantAnalysis } from '@/types/policies'

interface UseAutoAnalyzeOptions {
  draft: Partial<Policy>
  enabled?: boolean
  debounceMs?: number
  onAnalysisComplete?: (analysis: PolicyAssistantAnalysis) => void
  onError?: (error: unknown) => void
}

export function useAutoAnalyze({
  draft,
  enabled = true,
  debounceMs = 2000,
  onAnalysisComplete,
  onError,
}: UseAutoAnalyzeOptions) {
  const [analysis, setAnalysis] = useState<PolicyAssistantAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const analyze = useCallback(async () => {
    // Validate draft
    if (!draft.name || !draft.actions || draft.actions.length === 0) {
      setAnalysis(null)
      setError(null)
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await policyAssistantService.analyzeDraft(draft)
      setAnalysis(result)
      onAnalysisComplete?.(result)
    } catch (err) {
      console.error('[useAutoAnalyze] analyze error', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể phân tích policy draft'
      setError(errorMessage)
      setAnalysis(null)
      onError?.(err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [draft, onAnalysisComplete, onError])

  useEffect(() => {
    if (!enabled) {
      setAnalysis(null)
      setError(null)
      return
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      analyze()
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [draft, enabled, debounceMs, analyze])

  const manualAnalyze = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    analyze()
  }, [analyze])

  return {
    analysis,
    isAnalyzing,
    error,
    manualAnalyze,
  }
}
