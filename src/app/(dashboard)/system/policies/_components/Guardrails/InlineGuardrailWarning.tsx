'use client'

import { AlertTriangle, Info } from 'lucide-react'
import type { GuardrailWarning } from '../../_utils/guardrails'

interface InlineGuardrailWarningProps {
  warning: GuardrailWarning
  onAutoFix?: () => void
}

export function InlineGuardrailWarning({ warning, onAutoFix }: InlineGuardrailWarningProps) {
  const getIcon = () => {
    switch (warning.type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case 'suggestion':
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getBgColor = () => {
    switch (warning.type) {
      case 'error':
        return 'border-red-200 bg-red-50/60 text-red-900'
      case 'warning':
        return 'border-amber-200 bg-amber-50/60 text-amber-900'
      case 'suggestion':
        return 'border-blue-200 bg-blue-50/60 text-blue-900'
      default:
        return 'border-gray-200 bg-gray-50/60 text-gray-900'
    }
  }

  return (
    <div className={`mt-2 rounded-xl border p-3 text-sm ${getBgColor()}`}>
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1">
          <p className="font-medium">{warning.message}</p>
          {onAutoFix && (
            <button
              type="button"
              onClick={onAutoFix}
              className="mt-2 text-xs font-semibold underline hover:no-underline"
            >
              Thêm điều kiện này
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
