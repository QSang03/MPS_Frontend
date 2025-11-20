'use client'

import { motion } from 'framer-motion'
import { Bell, Menu, LogOut, User, Settings, ChevronDown, Zap, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePathname } from 'next/navigation'
import { NAVIGATION_PAYLOAD } from '@/constants/navigation'
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
import { ROUTES } from '@/constants/routes'
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useState } from 'react'
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
  const pageTitle = useUIStore((s) => s.pageTitle)
  const pathname = usePathname()
  const { unreadCount, isUnreadCountLoading } = useNotifications()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // derive the best matching title from NAVIGATION_PAYLOAD by choosing the longest
  // route that is a prefix of the current pathname. This ensures /system/devices
  // matches the 'Thiết bị' entry instead of the more generic '/system' dashboard.
  const derivedTitle = (() => {
    if (!pathname) return null
    const matches = NAVIGATION_PAYLOAD.filter((n) => n.route && pathname.startsWith(n.route))
    if (!matches.length) return null
    matches.sort((a, b) => (b.route?.length || 0) - (a.route?.length || 0))
    return matches[0]?.label ?? null
  })()

  const performLogout = async () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('mps_navigation')
      }
    } catch {
      // ignore
    }
    await logout()
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
      <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />

      <div className="border-b border-gray-200/50 bg-white/95 shadow-sm backdrop-blur-lg">
        <div className="flex h-23 items-center justify-between px-4 md:px-6">
          {/* Left side - Mobile menu button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg transition-all duration-300 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </motion.div>

          {/* Center - Page title (shows on large screens) */}
          <div className="hidden flex-1 items-center lg:flex">
            {derivedTitle || pageTitle ? (
              <div className="ml-2 min-w-0">
                <h2 className="font-display truncate text-lg font-bold text-gray-800">
                  {derivedTitle || pageTitle}
                </h2>
              </div>
            ) : (
              <div className="flex-1" />
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Dashboard shortcut - show on md+ and align with user avatar */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  router.push(
                    session.role === 'SystemAdmin' || session.role === 'CustomerAdmin'
                      ? ROUTES.CUSTOMER_ADMIN
                      : ROUTES.USER_MY_DEVICES
                  )
                }
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 hover:bg-blue-50 hover:text-blue-700 md:flex"
              >
                <LayoutDashboard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">Tổng quan</span>
              </Button>
            </motion.div>
            {/* Notifications - Premium Bell */}
            <NotificationPanel>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative rounded-lg transition-all duration-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Bell className="h-5 w-5" />
                  {!isUnreadCountLoading && unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
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
                    className="group gap-2.5 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700"
                  >
                    {/* Avatar with gradient border */}
                    <div className="relative">
                      <Avatar className="h-8 w-8 border-2 border-transparent transition-all duration-300 group-hover:border-blue-400">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
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
                      <ChevronDown className="h-4 w-4 text-gray-500 transition-all duration-300 group-hover:rotate-180 group-hover:text-blue-700" />
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
                <div className="rounded-t-lg border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border-2 border-blue-300 shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-800">
                        {session.username || 'Người dùng'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-600">{session.email}</p>
                      <div className="mt-2 inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
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
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-gray-700 transition-all duration-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">Hồ sơ cá nhân</span>
                      <ChevronDown className="h-3 w-3 rotate-90 opacity-50" />
                    </DropdownMenuItem>
                  </motion.div>

                  {/* Settings */}
                  <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                    <DropdownMenuItem
                      onClick={handleSettings}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-gray-700 transition-all duration-300 hover:bg-purple-50 hover:text-purple-700"
                    >
                      <Settings className="h-4 w-4 flex-shrink-0 transition-transform duration-300 hover:rotate-90" />
                      <span className="flex-1">Cài đặt tài khoản</span>
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
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-red-600 transition-all duration-300 hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">Đăng xuất</span>
                    </DropdownMenuItem>
                  </motion.div>
                </div>

                {/* Footer info */}
                <div className="rounded-b-lg border-t border-gray-100 bg-gradient-to-b from-transparent to-gray-50 p-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <p className="text-xs text-gray-600">
                      <span className="font-bold text-gray-800">MPS v1.0.0</span> • © 2025
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
            <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={performLogout} className="bg-red-600 hover:bg-red-700">
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
