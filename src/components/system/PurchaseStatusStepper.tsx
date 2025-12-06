'use client'

import type { PurchaseRequestStatus } from '@/constants/status'
import { PURCHASE_REQUEST_STATUS_DISPLAY, PurchaseRequestStatus as PRS } from '@/constants/status'
import { cn } from '@/lib/utils/cn'

interface Props {
  current: PurchaseRequestStatus
}

export function PurchaseStatusStepper({ current }: Props) {
  // Define the success path explicitly (excluding CANCELLED)
  const steps = [PRS.PENDING, PRS.APPROVED, PRS.ORDERED, PRS.IN_TRANSIT, PRS.RECEIVED]

  // If cancelled, show cancelled state
  const currentIndex = steps.indexOf(current)

  if (current === PRS.CANCELLED) {
    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-700">Quy trình xử lý</div>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          <div className="flex flex-shrink-0 items-center gap-1">
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-error-600)] text-xs font-medium text-white shadow-lg ring-2 ring-[var(--color-error-600)] ring-offset-2">
                ✕
              </div>
              <div className="mt-2 max-w-[80px] truncate text-center text-[11px] font-medium text-[var(--error-500)]">
                Đã hủy
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-700">Quy trình xử lý</div>
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => {
          const disp = PURCHASE_REQUEST_STATUS_DISPLAY[s]
          const isActive = i === currentIndex
          const isPast = i < currentIndex

          return (
            <div key={s} className="flex flex-shrink-0 items-center gap-1">
              <div className="flex flex-col items-center">
                <div
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium transition-all',
                    isActive
                      ? 'bg-[var(--color-success-500)] text-white shadow-lg ring-2 ring-[var(--color-success-500)] ring-offset-2'
                      : isPast
                        ? 'border-2 border-gray-300 bg-gray-200 text-gray-500'
                        : 'border-2 border-gray-200 bg-white text-gray-400'
                  )}
                >
                  {/* Only show checkmark for active state */}
                  {isActive ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <div
                      className={cn('h-3 w-3 rounded-full', isPast ? 'bg-gray-400' : 'bg-gray-300')}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    'mt-2 max-w-[80px] truncate text-center text-[11px] font-medium',
                    isActive
                      ? 'text-[var(--color-success-600)]'
                      : isPast
                        ? 'text-gray-500'
                        : 'text-gray-400'
                  )}
                >
                  {disp.label}
                </div>
              </div>

              {i < steps.length - 1 && (
                <div className="mx-1 flex items-center">
                  <svg
                    className={cn(
                      'h-5 w-8 transition-colors',
                      isPast ? 'text-gray-300' : 'text-gray-200'
                    )}
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15 8l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PurchaseStatusStepper
