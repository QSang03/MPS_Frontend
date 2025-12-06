import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  openSidebar: () => void
  // current page title shown in the global header (optional)
  pageTitle?: string
  setPageTitle: (title: string) => void
  // visual preferences - themeId is the theme preset ID (e.g., 'sky', 'cyan', 'violet')
  themeId?: string
  setThemeId: (id: string) => void
  // Legacy themeColor - kept for compatibility but now derived from themeId
  themeColor?: string
  setThemeColor: (color: string) => void
  fontFamily?: 'inter' | 'poppins' | 'mono'
  setFontFamily: (font: 'inter' | 'poppins' | 'mono') => void
}

/**
 * UI State Store using Zustand
 * Persists sidebar state to localStorage
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      closeSidebar: () => set({ sidebarOpen: false }),
      openSidebar: () => set({ sidebarOpen: true }),
      pageTitle: '',
      setPageTitle: (title: string) => set({ pageTitle: title }),
      // default visual prefs - default to 'sky' theme
      themeId: 'sky',
      setThemeId: (id: string) => set({ themeId: id }),
      themeColor: '',
      setThemeColor: (color: string) => set({ themeColor: color }),
      fontFamily: 'inter',
      setFontFamily: (font: 'inter' | 'poppins' | 'mono') => set({ fontFamily: font }),
    }),
    {
      name: 'mps-ui-storage',
    }
  )
)
