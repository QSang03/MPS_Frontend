'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import navigationClientService from '@/lib/api/services/navigation-client.service'
import { navigationConfigService } from '@/lib/api/services/navigation-config.service'
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

  // Helper to get current role from session cookie
  const getCurrentRole = (): string | null => {
    try {
      // Prefer client-side localStorage `mps_user_role` which is set on login
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('mps_user_role')
          if (stored) return stored
        } catch {
          // ignore localStorage error
        }
      }
      // Fallback to parsing session cookie if localStorage not available
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

  // Helper to get current roleId from session/localStorage
  const getCurrentRoleId = (): string | null => {
    try {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('mps_role_id')
          if (stored) return stored
        } catch {
          // ignore localStorage error
        }
      }
      const sessionCookie = Cookies.get('mps_session')
      if (sessionCookie) {
        const parts = sessionCookie.split('.')
        if (parts[1]) {
          const payload = JSON.parse(atob(parts[1]))
          return payload.roleId || payload.role_id || null
        }
      }
    } catch (err) {
      console.error('Failed to parse roleId from session', err)
    }
    return null
  }

  // Helper to check if user is admin (isDefaultCustomer: true) or regular user (isDefaultCustomer: false)
  // Prefer client-side flag `mps_is_default_customer` (set after login). Fallback to parsing session JWT if needed.
  const isAdminUser = (): boolean => {
    try {
      // Prefer client-side localStorage `mps_is_default_customer` (set after login). Fallback to cookie/session.
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('mps_is_default_customer')
          if (stored !== null) return stored === 'true'
        } catch {
          // ignore localStorage errors
        }
      }
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
        return true // Default to admin if session exists but no payload
      }
    } catch (err) {
      console.error('Failed to parse session cookie or client flag', err)
    }
    return true // Default to admin if can't parse
  }

  // Helper to get customerId from session
  const getCustomerId = (): string | null => {
    try {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('mps_customer_id')
          if (stored) return stored
        } catch {
          // ignore localStorage error
        }
      }
      const sessionCookie = Cookies.get('mps_session')
      if (sessionCookie) {
        const parts = sessionCookie.split('.')
        if (parts[1]) {
          const payload = JSON.parse(atob(parts[1]))
          return payload.customerId || null
        }
      }
    } catch (err) {
      console.error('Failed to parse customerId from session', err)
    }
    return null
  }

  // Load navigation config from backend
  const loadFromBackend = useCallback(async (): Promise<NavItemPayload[] | null> => {
    try {
      const customerId = getCustomerId()
      const roleId = getCurrentRoleId()
      const isActive = true

      const isConfigMatchRole = (cfg: { roleId?: string | null }, currentRoleId: string | null) => {
        if (currentRoleId) {
          return cfg.roleId === currentRoleId
        }
        // When user has no roleId, only accept configs that do NOT target a specific role
        return !cfg.roleId
      }

      // Try to get config for this customer first
      let config = null
      if (customerId) {
        const result = await navigationConfigService.getAll({
          customerId,
          isActive,
          roleId: roleId ?? undefined,
          limit: 1,
        })
        if (result.data && result.data.length > 0) {
          config = result.data.find((c) => isConfigMatchRole(c, roleId)) ?? null
        }
      }

      // If no customer-specific config, try to get default config (customerId = null)
      if (!config) {
        const defaultResult = await navigationConfigService.getAll({
          customerId: null,
          isActive,
          roleId: roleId ?? undefined,
          limit: 1,
        })
        if (defaultResult.data && defaultResult.data.length > 0) {
          config = defaultResult.data.find((c) => isConfigMatchRole(c, roleId)) ?? null
        }
      }

      // Return config items if found
      if (config && config.config && Array.isArray(config.config.items)) {
        console.log('[NavigationContext] Using config from backend:', config.name)
        return config.config.items
      }
    } catch (err) {
      console.error('[NavigationContext] Failed to load config from backend:', err)
    }
    return null
  }, [])

  // Extract role from session cookie (client-side)
  useEffect(() => {
    setSessionRole(getCurrentRole())
    if (typeof window !== 'undefined') {
      const handler = (e: StorageEvent) => {
        if (e.key === 'mps_user_role') {
          setSessionRole(e.newValue)
        }
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    }
    return undefined
  }, [])

  const load = useCallback(async () => {
    // Always start clean to avoid showing stale permissions
    setItems(null)
    setLoading(true)
    try {
      // Try to load config from backend first
      let payload: NavItemPayload[] | null = await loadFromBackend()

      // If no config from backend, fallback to hardcoded payload
      if (!payload) {
        const isAdmin = isAdminUser()
        console.log('[NavigationContext] No backend config found, using hardcoded payload')
        payload = isAdmin ? NAVIGATION_PAYLOAD : USER_NAVIGATION_PAYLOAD
      }

      // Localize payload labels/descriptions based on current locale before sending to backend
      try {
        const locale =
          (typeof window !== 'undefined' &&
            (localStorage.getItem('mps_locale') || Cookies.get('mps_locale'))) ||
          'en'

        // Small fallback translator for common VN -> EN phrases when labelEn missing
        const enLabelFallback = (label?: string) => {
          if (!label) return ''
          const map: Record<string, string> = {
            'Tổng quan': 'Overview',
            'Thiết bị': 'Devices',
            'Người dùng': 'Users',
            'Khách hàng': 'Customers',
            'Hợp đồng': 'Contracts',
            'Kho vật tư': 'Consumables',
            'Chứng từ kho': 'Warehouse documents',
            'Yêu cầu của tôi': 'My requests',
            'Yêu cầu khách hàng': 'Service requests',
            'Chi phí': 'Costs',
            'Doanh thu': 'Revenue',
            'Loại vật tư tiêu hao': 'Consumable types',
            'Mẫu thiết bị': 'Device models',
            'Quản lý người dùng': 'User management',
            'Quản trị SLA': 'SLA management',
            'Mẫu SLA': 'SLA templates',
          }
          if (map[label]) return map[label]
          // Verb prefixes
          if (label.startsWith('Tạo')) return label.replace(/^Tạo\s*/, 'Create ')
          if (label.startsWith('Chỉnh sửa')) return label.replace(/^Chỉnh sửa\s*/, 'Edit ')
          if (label.startsWith('Xóa')) return label.replace(/^Xóa\s*/, 'Delete ')
          if (label.startsWith('Xem')) return label.replace(/^Xem\s*/, 'View ')
          if (label.startsWith('Lọc theo')) return label.replace(/^Lọc theo\s*/, 'Filter by ')
          if (label.startsWith('Cập nhật')) return label.replace(/^Cập nhật\s*/, 'Update ')
          if (label.startsWith('Gán')) return label.replace(/^Gán(?:\/Gỡ)?\s*/, 'Assign ')
          return ''
        }

        payload = (payload || []).map((item) => ({
          ...item,
          label:
            (locale === 'vi' && item.labelVi) ||
            (locale === 'en' && (item.labelEn || enLabelFallback(item.label))) ||
            item.label,
          description:
            (locale === 'vi' && item.descriptionVi) ||
            (locale === 'en' && item.descriptionEn) ||
            item.description,
          actions: (item.actions || []).map((a) => ({
            ...a,
            label:
              (locale === 'vi' && a.labelVi) ||
              (locale === 'en' && (a.labelEn || enLabelFallback(a.label))) ||
              a.label,
          })),
        }))
      } catch {
        // ignore localization errors and continue
      }

      // Strip locale-specific labels from payload before sending to backend permission check
      const sanitizePayload = (itemsToSanitize: NavItemPayload[]): NavItemPayload[] =>
        itemsToSanitize.map((item) => {
          const sanitizedItem: NavItemPayload = { ...item }
          // Remove labelEn/labelVi so backend only sees display label/description
          if (item.labelEn !== undefined) {
            sanitizedItem.labelEn = undefined
          }
          if (item.labelVi !== undefined) {
            sanitizedItem.labelVi = undefined
          }
          if (item.descriptionEn !== undefined) {
            sanitizedItem.descriptionEn = undefined
          }
          if (item.descriptionVi !== undefined) {
            sanitizedItem.descriptionVi = undefined
          }
          sanitizedItem.actions = (item.actions || []).map((action) => {
            const sanitizedAction: NavActionPayload = { ...action }
            if (action.labelEn !== undefined) {
              sanitizedAction.labelEn = undefined
            }
            if (action.labelVi !== undefined) {
              sanitizedAction.labelVi = undefined
            }
            return sanitizedAction
          })
          return sanitizedItem
        })

      // Send navigation payload to backend to check permissions
      const resp = await navigationClientService.check(sanitizePayload(payload || []))
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

      // Reorder user navigation to desired sections/order (non-admin users only)
      // Order: overview -> devices -> users -> costs -> consumables -> warehouse-documents -> contracts -> others
      const prioritizeUserNav = (): NavigationItem[] => {
        const order = [
          'user-dashboard',
          'user-devices',
          'users',
          'user-costs',
          'user-consumables',
          'user-warehouse-documents',
          'user-contracts',
          'user-my-requests',
        ]
        const orderMap = new Map(order.map((id, idx) => [id, idx]))
        const base = Number.MAX_SAFE_INTEGER
        return [...filteredItems].sort((a, b) => {
          const aScore = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : base
          const bScore = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : base
          if (aScore !== bScore) return aScore - bScore
          return (a.label || a.id).localeCompare(b.label || b.id || '')
        })
      }

      const finalItems = isAdminUser() ? filteredItems : prioritizeUserNav()
      setItems(finalItems)
    } catch (err) {
      console.error('Failed to load navigation permissions', err)
      setItems(null)
    } finally {
      setLoading(false)
    }
  }, [loadFromBackend])

  useEffect(() => {
    // Load once on mount. Always hit backend to ensure latest permissions.
    void load()
  }, [load])

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
