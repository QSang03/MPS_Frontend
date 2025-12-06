'use client'

import type { ServiceRequestStatus } from '@/constants/status'
import { SERVICE_REQUEST_STATUS_DISPLAY, ServiceRequestStatus as SRS } from '@/constants/status'
import { cn } from '@/lib/utils/cn'

interface Props {
  current: ServiceRequestStatus
}

export function StatusStepper({ current }: Props) {
  // Define the success path explicitly
  const steps = [SRS.OPEN, SRS.APPROVED, SRS.IN_PROGRESS, SRS.RESOLVED, SRS.CLOSED]

  // If cancelled, we might want to show it, but for now let's just handle the success path.
  // If current is CANCELLED, currentIndex will be -1.
  const currentIndex = steps.indexOf(current)

  if (current === SRS.CANCELLED) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-semibold">Quy trình xử lý</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-xs font-medium text-white">
                ✕
              </div>
              <div className="text-muted-foreground mt-1 max-w-[70px] truncate text-center text-[10px]">
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
          const disp = SERVICE_REQUEST_STATUS_DISPLAY[s]
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
                      ? 'bg-green-500 text-white shadow-lg ring-2 shadow-green-500/50 ring-green-500 ring-offset-2'
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
                    isActive ? 'text-green-600' : isPast ? 'text-gray-500' : 'text-gray-400'
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

export default StatusStepper
