'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import navigationClientService from '@/lib/api/services/navigation-client.service'
import {
  NAVIGATION_PAYLOAD,
  type NavActionPayload,
  type NavItemPayload,
} from '@/constants/navigation'

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

  async function load() {
    setLoading(true)
    try {
      // Send FE navigation payload to backend to check permissions
      const resp = await navigationClientService.check(NAVIGATION_PAYLOAD)
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
      const filteredItems: NavigationItem[] = rawItems
        .filter((item) => {
          // Hide item if hasAccess is explicitly false
          if (item.hasAccess === false) {
            return false
          }

          // If item has actions, check if at least one action has access
          if (item.actions && Array.isArray(item.actions) && item.actions.length > 0) {
            const hasAllowedAction = item.actions.some((action) => action.hasAccess !== false)
            // If no actions are allowed, hide the item
            if (!hasAllowedAction) {
              return false
            }
          }

          // Item is visible (hasAccess is true or undefined, and either no actions or at least one allowed action)
          return true
        })
        .map((item) => {
          // Filter actions to only include those with hasAccess !== false
          if (item.actions && Array.isArray(item.actions)) {
            return {
              ...item,
              actions: item.actions.filter((action) => action.hasAccess !== false),
            }
          }
          return item
        })

      setItems(filteredItems)
    } catch (err) {
      console.error('Failed to load navigation permissions', err)
      setItems(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load once on mount. This will call /api/navigation and store items in context.
    void load()
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
