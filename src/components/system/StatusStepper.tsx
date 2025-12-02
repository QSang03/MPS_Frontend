'use client'

import type { ServiceRequestStatus } from '@/constants/status'
import { SERVICE_REQUEST_STATUS_DISPLAY, ServiceRequestStatus as SRS } from '@/constants/status'
import { cn } from '@/lib/utils/cn'

interface Props {
  current: ServiceRequestStatus
}

export function StatusStepper({ current }: Props) {
  const steps = Object.values(SRS) as ServiceRequestStatus[]
  const currentIndex = steps.indexOf(current)

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Quy trình xử lý</div>
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const disp = SERVICE_REQUEST_STATUS_DISPLAY[s]
          const state: 'completed' | 'active' | 'upcoming' =
            i < currentIndex ? 'completed' : i === currentIndex ? 'active' : 'upcoming'

          return (
            <div key={s} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div
                  aria-current={state === 'active' ? 'step' : undefined}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                    state === 'completed'
                      ? 'bg-blue-600 text-white'
                      : state === 'active'
                        ? 'border bg-white text-blue-700 ring-2 ring-offset-1'
                        : 'text-muted-foreground border bg-white'
                  )}
                >
                  {/* simple marker */}
                  {state === 'completed' ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <div className="h-2 w-2 rounded-full" />
                  )}
                </div>
                <div className="text-muted-foreground mt-1 max-w-[70px] truncate text-center text-[10px]">
                  {disp.label}
                </div>
              </div>

              {i < steps.length - 1 && (
                <div className="mx-2 flex items-center">
                  <svg
                    className={cn(
                      'h-4 w-6',
                      i < currentIndex ? 'text-blue-600' : 'text-muted-foreground'
                    )}
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M5 12h11"
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
