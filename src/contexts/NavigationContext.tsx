'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import navigationClientService from '@/lib/api/services/navigation-client.service'
import {
  NAVIGATION_PAYLOAD,
  USER_NAVIGATION_PAYLOAD,
  type NavActionPayload,
  type NavItemPayload,
} from '@/constants/navigation'
import Cookies from 'js-cookie'

interface NavigationSubmenu {
  label: string
  href: string
}

export interface NavigationItem extends NavItemPayload {
  hasAccess?: boolean
  actions?: Array<NavActionPayload & { hasAccess?: boolean }>
}

interface NavigationContextType {
  currentSubmenu: NavigationSubmenu | null
  setCurrentSubmenu: (submenu: NavigationSubmenu | null) => void
  items: NavigationItem[] | null
  loading: boolean
  refresh: () => Promise<void>
  sessionRole: string | null
  // Permission checking methods
  hasPageAccess: (pageId: string) => boolean
  hasActionAccess: (pageId: string, actionId: string) => boolean
  getPagePermissions: (pageId: string) => NavigationItem | null
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentSubmenu, setCurrentSubmenu] = useState<NavigationSubmenu | null>(null)
  const [items, setItems] = useState<NavigationItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionRole, setSessionRole] = useState<string | null>(null)
  const NAV_CACHE_KEY = 'mps_navigation'

  // Helper to get current role from session cookie
  const getCurrentRole = (): string | null => {
    try {
      const sessionCookie = Cookies.get('mps_session')
      if (sessionCookie) {
        const parts = sessionCookie.split('.')
        if (parts[1]) {
          const payload = JSON.parse(atob(parts[1]))
          return payload.role || null
        }
      }
    } catch (err) {
      console.error('Failed to parse session cookie', err)
    }
    return null
  }

  // Helper to check if user is admin (isDefaultCustomer: true) or regular user (isDefaultCustomer: false)
  // Prefer client-side flag `mps_is_default_customer` (set after login). Fallback to parsing session JWT if needed.
  const isAdminUser = (): boolean => {
    try {
      const clientFlag = Cookies.get('mps_is_default_customer')
      if (typeof clientFlag !== 'undefined') {
        return clientFlag === 'true'
      }

      const sessionCookie = Cookies.get('mps_session')
      if (sessionCookie) {
        const parts = sessionCookie.split('.')
        if (parts[1]) {
          const payload = JSON.parse(atob(parts[1]))
          // isDefaultCustomer: true -> admin user -> use NAVIGATION_PAYLOAD
          // isDefaultCustomer: false -> regular user -> use USER_NAVIGATION_PAYLOAD
          // undefined -> default to admin
          return payload.isDefaultCustomer !== false
        }
      }
    } catch (err) {
      console.error('Failed to parse session cookie or client flag', err)
    }
    return true // Default to admin if can't parse
  }

  // Extract role from session cookie (client-side)
  useEffect(() => {
    setSessionRole(getCurrentRole())
  }, [])

  async function load() {
    setLoading(true)
    try {
      // Check isDefaultCustomer to determine which payload to send
      const isAdmin = isAdminUser()

      // Debug: log for troubleshooting
      console.log('[NavigationContext] isAdminUser:', isAdmin)

      // Choose navigation payload based on isDefaultCustomer
      // isDefaultCustomer: true (or undefined) -> admin -> NAVIGATION_PAYLOAD
      // isDefaultCustomer: false -> regular user -> USER_NAVIGATION_PAYLOAD
      const payload = isAdmin ? NAVIGATION_PAYLOAD : USER_NAVIGATION_PAYLOAD

      console.log(
        '[NavigationContext] Using payload:',
        isAdmin ? 'NAVIGATION_PAYLOAD (admin)' : 'USER_NAVIGATION_PAYLOAD (user)'
      )

      // Send FE navigation payload to backend to check permissions
      const resp = await navigationClientService.check(payload)
      // Backend expected shapes supported:
      // 1) Array directly: [ { ...item } ]
      // 2) { data: [ ... ] }
      // 3) { items: [ ... ] } (some backends return data.items)
      // 4) { data: { items: [ ... ] } }
      const data = resp?.data ?? resp
      let rawItems: NavigationItem[] = []

      if (Array.isArray(data)) {
        rawItems = data as NavigationItem[]
      } else if (typeof data === 'object' && data !== null) {
        const d = data as Record<string, unknown>
        if (Array.isArray(d.items)) {
          rawItems = d.items as NavigationItem[]
        } else if (Array.isArray(d.data)) {
          rawItems = d.data as NavigationItem[]
        } else if (typeof d.data === 'object' && d.data !== null) {
          const inner = d.data as Record<string, unknown>
          if (Array.isArray(inner.items)) {
            rawItems = inner.items as NavigationItem[]
          }
        }
      }

      // Filter items and actions based on hasAccess
      // Note: `item.hasAccess` controls sidebar visibility; `action.hasAccess` controls actions inside the page.
      // Also hide sidebar item if outer hasAccess is true but 'read' action's hasAccess is false.
      const filteredItems: NavigationItem[] = rawItems
        .filter((item) => {
          // First check: outer hasAccess must not be false
          if (item.hasAccess === false) return false

          // Second check: if 'read' action exists, it must not have hasAccess: false
          if (item.actions && Array.isArray(item.actions)) {
            const readAction = item.actions.find((action) => action.id === 'read')
            if (readAction && readAction.hasAccess === false) {
              return false
            }
          }

          return true
        })
        .map((item) => {
          if (item.actions && Array.isArray(item.actions)) {
            return {
              ...item,
              actions: item.actions.filter((action) => action.hasAccess !== false),
            }
          }
          return item
        })

      setItems(filteredItems)
      try {
        // Cache navigation in localStorage so we can reuse it until logout
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(
            NAV_CACHE_KEY,
            JSON.stringify({ items: filteredItems, ts: Date.now() })
          )
        }
      } catch {
        // ignore cache write errors
      }
    } catch (err) {
      console.error('Failed to load navigation permissions', err)
      setItems(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Try to read cached navigation first (persist between login and logout)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(NAV_CACHE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as { items?: NavigationItem[]; ts?: number }
          if (parsed?.items && Array.isArray(parsed.items)) {
            setItems(parsed.items)
            setLoading(false)
            return
          }
        }
      }
    } catch {
      // ignore parse errors and fall back to remote fetch
    }

    // Load once on mount. This will call /api/navigation and store items in context.
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helper function to check if user has access to a page
  const hasPageAccess = (pageId: string): boolean => {
    if (!items) return false
    const item = items.find((i) => i.id === pageId)
    return item !== undefined && item.hasAccess !== false
  }

  // Helper function to check if user has access to a specific action
  const hasActionAccess = (pageId: string, actionId: string): boolean => {
    if (!items) return false
    const item = items.find((i) => i.id === pageId)
    if (!item || !item.actions) return false
    const action = item.actions.find((a) => a.id === actionId)
    return action !== undefined && action.hasAccess !== false
  }

  // Get all permissions for a specific page
  const getPagePermissions = (pageId: string): NavigationItem | null => {
    if (!items) return null
    return items.find((i) => i.id === pageId) || null
  }

  return (
    <NavigationContext.Provider
      value={{
        currentSubmenu,
        setCurrentSubmenu,
        items,
        loading,
        refresh: load,
        sessionRole,
        hasPageAccess,
        hasActionAccess,
        getPagePermissions,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}
