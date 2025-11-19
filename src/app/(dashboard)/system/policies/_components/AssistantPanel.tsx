import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react'
import type { PolicyAssistantAnalysis, Policy } from '@/types/policies'
import { TestScenarioTable } from './TestScenarioTable'
import { AIAssistantPanel } from './AIAssistantPanel'

interface AssistantPanelProps {
  analysis: PolicyAssistantAnalysis | null
  analysisError?: string | null
  onAnalyze: () => Promise<void>
  onCreate: () => Promise<void>
  isAnalyzing: boolean
  isCreating: boolean
  safeToCreate: boolean
  draftValid: boolean
  draft?: Partial<Policy>
  onUseSuggestion?: (policy: Partial<Policy>) => void
}

export function AssistantPanel({
  analysis,
  analysisError,
  onAnalyze,
  onCreate,
  isAnalyzing,
  isCreating,
  safeToCreate,
  draftValid,
  onUseSuggestion,
}: AssistantPanelProps) {
  return (
    <Card className="flex h-full flex-col gap-5 rounded-2xl border-2 border-slate-100 p-5 shadow-xl">
      <Tabs defaultValue="analysis" className="flex h-full flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis">Phân tích</TabsTrigger>
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="flex-1 space-y-5 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold tracking-widest text-fuchsia-500 uppercase">
              AI Assistant
            </p>
            <h2 className="text-2xl font-bold text-slate-900">Phân tích & Guardrail</h2>
            <p className="text-sm text-slate-500">
              Analyze draft để nhận conflict, khuyến nghị và test scenario.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {safeToCreate ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-700">Trạng thái draft</p>
                  <p className="text-xs text-slate-500">
                    {safeToCreate
                      ? 'Safe to create - không phát hiện conflict nghiêm trọng.'
                      : 'Có conflicts được phát hiện. Bạn vẫn có thể tạo policy, nhưng hãy xem xét các conflicts bên dưới.'}
                  </p>
                </div>
              </div>
              <Badge variant={safeToCreate ? 'default' : 'secondary'}>
                {safeToCreate ? 'Safe' : 'Pending'}
              </Badge>
            </div>

            {!draftValid ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Tên policy và actions là bắt buộc trước khi Analyze.
              </div>
            ) : null}
          </div>

          {analysisError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {analysisError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
              onClick={onAnalyze}
              disabled={isAnalyzing || !draftValid}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                'Analyze Draft'
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className={`rounded-2xl ${
                safeToCreate
                  ? 'border-emerald-300 text-emerald-700'
                  : 'border-amber-300 text-amber-700'
              }`}
              onClick={onCreate}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : safeToCreate ? (
                'Create Policy'
              ) : (
                'Create Policy (Có conflicts)'
              )}
            </Button>
          </div>

          {analysis ? (
            <>
              <Separator />
              <div className="space-y-4 overflow-y-auto">
                {analysis.conflicts?.length ? (
                  <div className="space-y-2 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                    <p className="text-sm font-semibold text-red-700">Conflicts</p>
                    {analysis.conflicts.map((conflict, idx) => (
                      <div
                        key={`${conflict.policy_name}-${idx}`}
                        className="rounded-xl bg-white/80 p-3"
                      >
                        <p className="text-sm font-semibold text-red-700">{conflict.policy_name}</p>
                        <p className="text-xs text-slate-500">
                          Effect: {conflict.effect} | Actions:{' '}
                          {(conflict.overlapping_actions || []).join(', ') || '—'}
                        </p>
                        {(conflict.reasons || []).length ? (
                          <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
                            {conflict.reasons?.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        ) : null}
                        {(conflict.suggestions || []).length ? (
                          <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50/70 p-2 text-xs text-amber-700">
                            {conflict.suggestions?.join(' | ')}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {analysis.warnings?.length ? (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                    <p className="text-sm font-semibold text-amber-700">Warnings</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-700">
                      {analysis.warnings.map((warning, idx) => (
                        <li key={`${warning}-${idx}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {analysis.recommendations?.length ? (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-700">Recommendations</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      {analysis.recommendations.map((change, idx) => (
                        <li key={`${change}-${idx}`}>{change}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {analysis.testScenarios?.length ? (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-700">Test scenarios (OPA)</p>
                    <TestScenarioTable scenarios={analysis.testScenarios} />
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              {analysisError
                ? 'Có lỗi khi phân tích. Vui lòng kiểm tra lại dữ liệu và thử lại.'
                : 'Chưa có phân tích. Hãy nhấn “Analyze Draft” để nhận conflict & đề xuất.'}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat" className="flex-1">
          <AIAssistantPanel onUseSuggestion={onUseSuggestion} onAutoAnalyze={onAnalyze} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
