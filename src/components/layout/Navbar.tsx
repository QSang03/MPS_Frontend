'use client'

import { Bell, Menu, LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { logout } from '@/app/actions/auth'
import type { Session } from '@/types/auth'
import { useUIStore } from '@/lib/store/uiStore'

interface NavbarProps {
  session: Session
}

export function Navbar({ session }: NavbarProps) {
  const { toggleSidebar } = useUIStore()

  const handleLogout = async () => {
    await logout()
  }

  // Get initials for avatar
  const initials = session.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="bg-background flex h-16 items-center justify-between border-b px-4">
      {/* Left side - Mobile menu button */}
      <Button variant="ghost" size="sm" className="lg:hidden" onClick={toggleSidebar}>
        <Menu className="h-6 w-6" />
      </Button>

      {/* Center - Page title (can be dynamic) */}
      <div className="hidden flex-1 lg:block">
        {/* Empty for now - can add breadcrumb or page title */}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <span className="bg-destructive absolute top-1 right-1 h-2 w-2 rounded-full" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline">{session.username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{session.username}</p>
                <p className="text-muted-foreground text-xs">{session.email}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Vai trò: <span className="font-medium">{session.role}</span>
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Hồ sơ
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
