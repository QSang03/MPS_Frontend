'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import navigationClientService from '@/lib/api/services/navigation-client.service'
import { NAVIGATION_PAYLOAD, type NavItemPayload } from '@/constants/navigation'

interface NavigationSubmenu {
  label: string
  href: string
}

export interface NavigationItem extends NavItemPayload {
  hasAccess?: boolean
  actions?: Array<NavItemPayload & { hasAccess?: boolean }>
}

interface NavigationContextType {
  currentSubmenu: NavigationSubmenu | null
  setCurrentSubmenu: (submenu: NavigationSubmenu | null) => void
  items: NavigationItem[] | null
  loading: boolean
  refresh: () => Promise<void>
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
      // Backend expected shape: { success, data: [ { ...item, hasAccess, actions: [{...hasAccess}] } ] }
      const data = resp?.data || resp
      if (Array.isArray(data)) {
        setItems(data as NavigationItem[])
      } else if (data?.data && Array.isArray(data.data)) {
        setItems(data.data as NavigationItem[])
      } else {
        setItems(null)
      }
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

  return (
    <NavigationContext.Provider
      value={{ currentSubmenu, setCurrentSubmenu, items, loading, refresh: load }}
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
