import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react'
import type { PolicyBlueprint } from '@/types/policies'

interface RoleBuilderPanelProps {
  roles: { id: string; name: string; level?: number }[]
  selectedRole: string
  onSelectRole: (roleName: string) => void
  blueprint?: PolicyBlueprint
  isBlueprintLoading: boolean
  onRefreshBlueprint: () => Promise<unknown>
}

export function RoleBuilderPanel({
  roles,
  selectedRole,
  onSelectRole,
  blueprint,
  isBlueprintLoading,
  onRefreshBlueprint,
}: RoleBuilderPanelProps) {
  const [customRole, setCustomRole] = useState('')

  const handleApplyCustomRole = () => {
    if (!customRole.trim()) return
    onSelectRole(customRole.trim())
    setCustomRole('')
  }

  return (
    <Card className="flex h-full flex-col gap-6 rounded-2xl border-2 border-slate-100 p-6 shadow-lg">
      <div>
        <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase">
          Role Builder
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Chọn vai trò & guardrail</h2>
        <p className="text-sm text-slate-500">
          Nền tảng guardrail ABAC giúp đảm bảo isolation & least privilege.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold text-slate-700">Role hiện có</Label>
          <Select value={selectedRole} onValueChange={onSelectRole}>
            <SelectTrigger className="mt-1 rounded-xl border-slate-200">
              <SelectValue placeholder="Chọn role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  <div className="flex items-center justify-between gap-2">
                    <span>{role.name}</span>
                    {typeof role.level !== 'undefined' ? (
                      <Badge variant="outline">Lv {role.level}</Badge>
                    ) : null}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-semibold text-slate-700">Hoặc nhập role khác</Label>
          <div className="mt-1 flex gap-2">
            <Input
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="VD: customer-auditor"
              className="rounded-xl"
            />
            <Button onClick={handleApplyCustomRole} className="rounded-xl">
              Áp dụng
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Guardrail & Blueprint
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onRefreshBlueprint()}
            className="rounded-full"
          >
            <RefreshCw className={`h-4 w-4 ${isBlueprintLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
          <p className="text-sm font-semibold text-indigo-900">Blueprint summary</p>
          <p className="text-sm text-indigo-700">
            {blueprint?.summary || 'Chọn role để xem blueprint mới nhất.'}
          </p>
        </div>

        <div className="space-y-3">
          {(blueprint?.recommendedGuardrails || ['Luôn giữ isolation giữa customers']).map(
            (guardrail, idx) => (
              <div
                key={`${guardrail}-${idx}`}
                className="flex gap-3 rounded-xl border border-slate-100 bg-white/70 p-3 text-sm text-slate-700"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <p>{guardrail}</p>
              </div>
            )
          )}
        </div>

        {blueprint?.missingPatterns && blueprint.missingPatterns.length > 0 ? (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                <Sparkles className="h-4 w-4" />
                Missing guardrails / patterns
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {blueprint.missingPatterns.map((item, idx) => (
                  <li key={`${item}-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {blueprint?.samplePolicies && blueprint.samplePolicies.length > 0 ? (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Sample policies
              </div>
              <div className="space-y-2">
                {blueprint.samplePolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className="rounded-xl border border-slate-100 bg-white p-3 text-sm text-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{policy.name}</p>
                      <Badge variant="outline">{policy.effect}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Actions: {policy.actions.join(', ') || '—'}
                    </p>
                    {policy.keySubjects?.length ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Subjects: {policy.keySubjects.join(' • ')}
                      </p>
                    ) : null}
                    {policy.keyResources?.length ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Resources: {policy.keyResources.join(' • ')}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Card>
  )
}
