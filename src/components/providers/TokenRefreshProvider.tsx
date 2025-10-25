'use client'

import { useEffect, useRef } from 'react'
import { refreshAccessTokenForClient } from '@/lib/auth/server-actions'
import { getClientAccessToken } from '@/lib/auth/client-auth'

/**
 * TokenRefreshProvider
 * - Calls server action to refresh access token automatically before it expires.
 * - Uses the access token's exp claim to schedule the refresh. Falls back to periodic checks.
 */
export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const timeoutRef = useRef<number | null>(null)
  const retryIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true

    const clearTimers = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (retryIntervalRef.current) {
        window.clearInterval(retryIntervalRef.current)
        retryIntervalRef.current = null
      }
    }

    const parseJwtExp = (token: string | null): number | null => {
      if (!token) return null
      try {
        const parts = token.split('.')
        if (parts.length < 2) return null
        const payload = parts[1] || ''
        if (!payload) return null
        // atob may throw for malformed strings
        const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
        if (json && typeof json.exp === 'number') return json.exp * 1000
      } catch {
        // ignore malformed token parse
      }
      return null
    }

    const scheduleRefresh = async () => {
      try {
        const token = await getClientAccessToken()
        const expMs = parseJwtExp(token)
        const now = Date.now()
        const bufferMs = 60 * 1000 // refresh 60s before expiry

        clearTimers()

        if (!token || !expMs) {
          // No token available or can't parse -> poll periodically to detect login
          retryIntervalRef.current = window.setInterval(() => {
            getClientAccessToken().then((t) => {
              if (t) {
                // got token, reschedule
                if (retryIntervalRef.current) {
                  window.clearInterval(retryIntervalRef.current)
                  retryIntervalRef.current = null
                }
                scheduleRefresh()
              }
            })
          }, 60 * 1000) // check every 60s
          return
        }

        const msUntilRefresh = Math.max(5000, expMs - now - bufferMs)
        // schedule refresh
        timeoutRef.current = window.setTimeout(() => {
          attemptRefresh()
        }, msUntilRefresh)
      } catch (err) {
        console.error('TokenRefreshProvider schedule error', err)
      }
    }

    const attemptRefresh = async (retry = 0) => {
      try {
        // call server action to refresh token; this may update cookies server-side
        const res = await refreshAccessTokenForClient()
        if (res) {
          // res is new access token or null; after refreshing, reschedule
          scheduleRefresh()
        } else {
          // refresh failed or returned null; retry a few times with backoff
          if (retry < 3) {
            const backoff = Math.min(30000, 2000 * Math.pow(2, retry))
            timeoutRef.current = window.setTimeout(() => attemptRefresh(retry + 1), backoff)
          } else {
            // give up and start polling for login state
            scheduleRefresh()
          }
        }
      } catch (error) {
        console.error('TokenRefreshProvider refresh error', error)
        if (retry < 3) {
          const backoff = Math.min(30000, 2000 * Math.pow(2, retry))
          timeoutRef.current = window.setTimeout(() => attemptRefresh(retry + 1), backoff)
        } else {
          scheduleRefresh()
        }
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // on focus/visible, ensure we are scheduled correctly and attempt refresh if near expiry
        scheduleRefresh()
      }
    }

    if (mounted) {
      scheduleRefresh()
      document.addEventListener('visibilitychange', handleVisibility)
    }

    return () => {
      mounted = false
      clearTimers()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
    // intentionally run only on mount/unmount
  }, [])

  return <>{children}</>
}

export default TokenRefreshProvider
