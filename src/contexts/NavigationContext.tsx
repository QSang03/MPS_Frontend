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
import type { NavigationConfig } from '@/types/navigation-config'
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

      console.log('[NavigationContext] Loading configs for:', { customerId, roleId, isActive })

      // Helper to check if config matches user's roleId
      // STRICT MATCHING: Only accept configs that match exactly
      const isRoleMatch = (cfgRoleId: string | null | undefined): boolean => {
        if (roleId) {
          // User has roleId: config must have same roleId or be null (generic config for all roles)
          return cfgRoleId === roleId || cfgRoleId === null || cfgRoleId === undefined
        } else {
          // User has no roleId: only accept configs with roleId = null (generic configs)
          // Reject configs with specific roleId as they don't match the user
          return cfgRoleId === null || cfgRoleId === undefined
        }
      }

      // Collect all matching configs with priority
      const allConfigs: Array<{
        config: NavigationConfig
        priority: number
      }> = []

      // Get configs for this customer (if customerId exists)
      if (customerId) {
        console.log(
          '[NavigationContext] Fetching customer-specific configs for customerId:',
          customerId
        )
        const customerResult = await navigationConfigService.getAll({
          customerId,
          isActive,
          limit: 100, // Get all configs for this customer
        })
        console.log('[NavigationContext] Customer-specific result:', {
          count: customerResult.data?.length || 0,
          configs: customerResult.data?.map((c) => ({
            name: c.name,
            customerId: c.customerId,
            roleId: c.roleId,
          })),
        })
        if (customerResult.data && customerResult.data.length > 0) {
          customerResult.data.forEach((cfg) => {
            // CRITICAL: Only accept configs with customerId matching the user's customerId
            // Reject configs that have a different customerId (they shouldn't be in customer-specific results)
            if (cfg.customerId !== customerId) {
              console.log(
                '[NavigationContext] Customer config rejected - customerId mismatch:',
                cfg.name,
                {
                  cfgCustomerId: cfg.customerId,
                  userCustomerId: customerId,
                }
              )
              return
            }

            const roleMatches = isRoleMatch(cfg.roleId)
            console.log('[NavigationContext] Checking config:', {
              name: cfg.name,
              cfgRoleId: cfg.roleId,
              userRoleId: roleId,
              roleMatches,
            })
            // Only include configs that match roleId
            if (!roleMatches) {
              console.log('[NavigationContext] Config rejected - roleId mismatch:', cfg.name)
              return
            }

            // Calculate priority: higher number = higher priority
            let priority = 0
            // customerId matches (already filtered by query) - highest priority
            priority += 100
            // roleId matches exactly
            if (roleId && cfg.roleId === roleId) {
              priority += 50 // customerId match + roleId match = 150 (highest)
            } else if (!roleId && !cfg.roleId) {
              // Both are null
              priority += 50 // customerId match + no roleId = 150 (highest)
            } else if (roleId && !cfg.roleId) {
              // User has roleId but config doesn't target specific role (lower priority)
              priority += 10 // customerId match + generic role = 110
            } else if (!roleId && cfg.roleId) {
              // User has no roleId but config has specific roleId (lowest priority for customer-specific)
              priority += 5 // customerId match + config has roleId but user doesn't = 105
            }
            allConfigs.push({ config: cfg, priority })
          })
        }
      } else {
        console.log('[NavigationContext] No customerId found, skipping customer-specific configs')
      }

      // Get default configs (customerId = null) - only if no customer-specific config found
      // But we still need to check all to find the best match
      console.log('[NavigationContext] Fetching default configs (customerId=null)')
      const defaultResult = await navigationConfigService.getAll({
        customerId: null,
        isActive,
        limit: 100, // Get all default configs
      })
      console.log('[NavigationContext] Default configs result:', {
        count: defaultResult.data?.length || 0,
        configs: defaultResult.data?.map((c) => ({
          name: c.name,
          customerId: c.customerId,
          roleId: c.roleId,
        })),
      })
      if (defaultResult.data && defaultResult.data.length > 0) {
        defaultResult.data.forEach((cfg) => {
          // CRITICAL: Only accept configs with customerId = null (true default configs)
          // Reject configs that have a different customerId (they shouldn't be in default results)
          if (cfg.customerId !== null && cfg.customerId !== undefined) {
            console.log('[NavigationContext] Default config rejected - has customerId:', cfg.name, {
              cfgCustomerId: cfg.customerId,
              userCustomerId: customerId,
            })
            return
          }

          const roleMatches = isRoleMatch(cfg.roleId)
          console.log('[NavigationContext] Checking default config:', {
            name: cfg.name,
            cfgRoleId: cfg.roleId,
            userRoleId: roleId,
            roleMatches,
          })
          // Only include configs that match roleId
          if (!roleMatches) {
            console.log('[NavigationContext] Default config rejected - roleId mismatch:', cfg.name)
            return
          }

          // Calculate priority: higher number = higher priority
          let priority = 0
          // customerId is null (default config) - lower priority than customer-specific
          priority += 0
          // roleId matches exactly
          if (roleId && cfg.roleId === roleId) {
            priority += 30 // customerId null + roleId match = 30 (lower than customer-specific)
          } else if (!roleId && !cfg.roleId) {
            // Both are null
            priority += 30 // customerId null + no roleId = 30
          } else if (roleId && !cfg.roleId) {
            // User has roleId but config doesn't target specific role (lower priority)
            priority += 5 // customerId null + generic role = 5 (lowest)
          } else if (!roleId && cfg.roleId) {
            // User has no roleId but config has specific roleId (very low priority)
            priority += 1 // customerId null + config has roleId but user doesn't = 1 (very low)
          }
          allConfigs.push({ config: cfg, priority })
        })
      }

      console.log('[NavigationContext] Total matching configs found:', allConfigs.length)

      // Sort by priority (descending) and select the highest priority config
      if (allConfigs.length > 0) {
        allConfigs.sort((a, b) => {
          // Primary sort: by priority (descending)
          if (b.priority !== a.priority) {
            return b.priority - a.priority
          }
          // Secondary sort: prefer configs with customerId (if priority equal)
          const aHasCustomerId = a.config.customerId ? 1 : 0
          const bHasCustomerId = b.config.customerId ? 1 : 0
          return bHasCustomerId - aHasCustomerId
        })

        // Log all configs for debugging
        console.log(
          '[NavigationContext] Available configs:',
          allConfigs.map((c) => ({
            name: c.config.name,
            customerId: c.config.customerId,
            roleId: c.config.roleId,
            priority: c.priority,
          }))
        )

        const selectedConfig = allConfigs[0]?.config

        // Return config items if found
        if (selectedConfig && selectedConfig.config && Array.isArray(selectedConfig.config.items)) {
          console.log('[NavigationContext] Selected config from backend:', selectedConfig.name, {
            customerId: selectedConfig.customerId,
            roleId: selectedConfig.roleId,
            priority: allConfigs[0]?.priority,
          })
          return selectedConfig.config.items
        }
      } else {
        console.log('[NavigationContext] No matching configs found after filtering')
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
