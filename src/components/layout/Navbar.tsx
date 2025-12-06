'use client'

import { motion } from 'framer-motion'
import {
  Bell,
  Menu,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Zap,
  LayoutDashboard,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/providers/LocaleProvider'
import { usePathname } from 'next/navigation'
import { NAVIGATION_PAYLOAD, USER_NAVIGATION_PAYLOAD } from '@/constants/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { logout } from '@/app/actions/auth'
import type { Session } from '@/types/auth'
import { useUIStore } from '@/lib/store/uiStore'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ROUTES } from '@/constants/routes'
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useState, useEffect } from 'react'
import { clearAuthCookies } from '@/lib/auth/client-auth'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
// 'cn' helper removed from imports (not used here)

interface NavbarProps {
  session: Session
}

export function Navbar({ session }: NavbarProps) {
  const { toggleSidebar } = useUIStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const pageTitle = useUIStore((s) => s.pageTitle)
  const pathname = usePathname()
  const { unreadCount, isUnreadCountLoading } = useNotifications()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const { t } = useLocale()

  // Start with a server-safe default to avoid SSR/client mismatch. Update
  // the value on the client after hydration. We defer the setState call
  // using `setTimeout` to avoid the lint warning about synchronous
  // setState inside effects.
  const [companyName, setCompanyName] = useState<string>('CHINH NHAN TECHNOLOGY')

  useEffect(() => {
    // Set default localized company name on mount
    setCompanyName(t('sidebar.logo.subtitle'))

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const n = localStorage.getItem('mps_customer_name')
        if (n && n.trim().length > 0) {
          // Defer the update so it's not considered a synchronous setState
          // inside the effect body (avoids cascading render lint warnings).
          setTimeout(() => setCompanyName(n), 0)
        }
      }
    } catch {
      // ignore
    }
  }, [t])

  // derive the best matching title from NAVIGATION_PAYLOAD by choosing the longest
  // route that is a prefix of the current pathname. This ensures /system/devices
  // matches the 'Thiết bị' entry instead of the more generic '/system' dashboard.
  // Choose navigation payload depending on current path (user vs admin)
  const navPayload =
    pathname && pathname.startsWith('/user') ? USER_NAVIGATION_PAYLOAD : NAVIGATION_PAYLOAD

  const derivedTitle = (() => {
    if (!pathname) return null
    const matches = navPayload.filter((n) => n.route && pathname.startsWith(n.route))
    if (!matches.length) return null
    matches.sort((a, b) => (b.route?.length || 0) - (a.route?.length || 0))
    const m = matches[0]
    if (!m) return null

    // Try to translate by name first, then by id, then fallback to label
    if (m.name) {
      const translated = t(`nav.${String(m.name)}`)
      if (translated && translated !== `nav.${String(m.name)}`) {
        return translated
      }
    }

    // Try to translate by id if name translation failed or name doesn't exist
    if (m.id) {
      const translated = t(`nav.${String(m.id)}`)
      if (translated && translated !== `nav.${String(m.id)}`) {
        return translated
      }
    }

    // Fallback to label
    return m.label ?? null
  })()

  const performLogout = async () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('mps_navigation')
        localStorage.removeItem('mps_customer_name')
        // Reset displayed company name immediately on logout
        setCompanyName('CHÍNH NHÂN TECHNOLOGY')
      }
    } catch {
      // ignore
    }
    try {
      // Clear react-query cache to avoid leaking previous user's data
      try {
        queryClient.clear()
      } catch {
        // ignore
      }

      // Clear any non-httpOnly cookies if present
      try {
        clearAuthCookies()
      } catch {
        // ignore
      }
    } finally {
      // Call server-side logout which destroys session and redirects
      await logout()
    }
  }

  const handleProfile = () => {
    router.push(ROUTES.USER_PROFILE)
  }

  const handleSettings = () => {
    router.push(ROUTES.USER_SETTINGS)
  }

  // Get initials for avatar
  const initials =
    session?.username
      ?.split(' ')
      ?.map((n) => n[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'U'

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Gradient border bottom */}
      <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-400)] to-transparent opacity-50" />

      <div className="border-b border-gray-200/50 bg-white/95 shadow-sm backdrop-blur-lg">
        <div className="flex h-23 items-center justify-between px-4 md:px-6">
          {/* Left side - Mobile menu button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg transition-all duration-300 hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </motion.div>

          {/* Mobile Logo */}
          <div className="mr-auto ml-2 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[var(--brand-600)]">
              <Printer className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-slate-900">{t('sidebar.logo.title')}</span>
          </div>

          {/* Center - Page title & Company (compact) */}
          <div className="hidden flex-1 items-center px-2 lg:flex">
            <div className="ml-2 min-w-0">
              <div className="flex items-center gap-3">
                <div className="hidden rounded-lg bg-[var(--brand-50)] p-2 text-[var(--brand-600)] sm:block">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="font-display truncate text-lg font-bold text-gray-800">
                    {derivedTitle || pageTitle || t('nav.overview')}
                  </h2>
                  <div className="mt-0.5 text-xs text-gray-500">
                    <span className="font-medium text-gray-600">{companyName}</span>
                    <span className="hidden sm:inline">
                      {' '}
                      • {t('dashboard.month')} {currentMonth}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1 md:gap-3">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            {/* Dashboard shortcut removed in favor of header info */}
            {/* Notifications - Premium Bell */}
            <NotificationPanel>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative rounded-lg transition-all duration-300 hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
                >
                  <Bell className="h-5 w-5" />
                  {!isUnreadCountLoading && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-error-600)] px-1.5 text-[10px] leading-none font-bold text-white shadow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </motion.div>
            </NotificationPanel>

            {/* Divider */}
            <div className="hidden h-6 w-px bg-gray-200 md:block" />

            {/* User menu - Premium Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild suppressHydrationWarning>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    className="group gap-2.5 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-[var(--brand-50)] hover:to-[var(--brand-100)] hover:text-[var(--brand-700)]"
                  >
                    {/* Avatar with gradient border */}
                    <div className="relative">
                      <Avatar className="h-8 w-8 border-2 border-transparent transition-all duration-300 group-hover:border-blue-400">
                        <AvatarFallback className="bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] text-xs font-bold text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"></div>
                    </div>

                    {/* Email and Chevron */}
                    <div className="hidden items-center gap-1 md:flex">
                      <span className="max-w-[150px] truncate text-sm font-semibold text-gray-700">
                        {session.username || session.email}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500 transition-all duration-300 group-hover:rotate-180 group-hover:text-[var(--brand-700)]" />
                    </div>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>

              {/* Dropdown Content - Premium Design */}
              <DropdownMenuContent
                align="end"
                className="w-64 rounded-xl border-2 border-gray-100 bg-white p-0 shadow-xl backdrop-blur-sm"
                suppressHydrationWarning
              >
                {/* Header with gradient background */}
                <div className="rounded-t-lg border-b border-gray-100 bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-200)] p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border-2 border-[var(--brand-300)] shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] text-sm font-bold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-800">
                        {session.username || t('user')}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-600">{session.email}</p>
                      <div className="mt-2 inline-block rounded-full bg-[var(--brand-100)] px-2.5 py-1 text-xs font-bold text-[var(--brand-700)]">
                        {session.role}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  {/* Profile */}
                  <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                    <DropdownMenuItem
                      onClick={handleProfile}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-gray-700 transition-all duration-300 hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
                    >
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{t('profile')}</span>
                      <ChevronDown className="h-3 w-3 rotate-90 opacity-50" />
                    </DropdownMenuItem>
                  </motion.div>

                  {/* Settings */}
                  <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                    <DropdownMenuItem
                      onClick={handleSettings}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-gray-700 transition-all duration-300 hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
                    >
                      <Settings className="h-4 w-4 flex-shrink-0 transition-transform duration-300 hover:rotate-90" />
                      <span className="flex-1">{t('settings.account')}</span>
                      <ChevronDown className="h-3 w-3 rotate-90 opacity-50" />
                    </DropdownMenuItem>
                  </motion.div>
                </div>

                {/* Divider */}
                <DropdownMenuSeparator className="my-1 bg-gray-100" />

                {/* Logout */}
                <div className="p-2">
                  <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        setShowLogoutConfirm(true)
                      }}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-[var(--error-500)] transition-all duration-300 hover:bg-[var(--error-50)] hover:text-[var(--error-500)]"
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{t('logout')}</span>
                    </DropdownMenuItem>
                  </motion.div>
                </div>

                {/* Footer info */}
                <div className="rounded-b-lg border-t border-gray-100 bg-gradient-to-b from-transparent to-gray-50 p-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-[var(--warning-500)]" />
                    <p className="text-xs text-gray-600">
                      <span className="font-bold text-gray-800">{t('footer.version')}</span> • ©
                      2025
                    </p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('logout.confirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('logout.confirm.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={performLogout}
              className="bg-[var(--color-error-600)] hover:bg-[var(--color-error-600)]/90"
            >
              {t('logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
