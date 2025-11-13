'use client'

import { useState } from 'react'
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  submenu?: Array<{
    label: string
    href: string
  }>
}

interface SidebarNavItemProps {
  item: NavItem
  index: number
}

export function SidebarNavItem({ item, index }: SidebarNavItemProps) {
  const pathname = usePathname()

  // Check if this item or any submenu is active
  const isParentActive =
    item.href === '/system'
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + '/')

  // Auto-expand if submenu item is active
  const hasActiveSubmenu = item.submenu?.some((sub) => pathname.startsWith(sub.href))

  // Always expanded when has active submenu, otherwise user can toggle
  const [isExpanded, setIsExpanded] = useState(hasActiveSubmenu || false)

  // Keep expanded when submenu is active (force open, can't close)
  React.useEffect(() => {
    if (hasActiveSubmenu) {
      setIsExpanded(true)
    }
  }, [hasActiveSubmenu])

  const hasSubmenu = item.submenu && item.submenu.length > 0

  // Toggle submenu - but NOT when submenu is active (force navigate instead)
  const handleToggle = (e: React.MouseEvent) => {
    // If has active submenu, don't prevent default - let it navigate to parent
    if (hasActiveSubmenu) {
      // Let the Link navigate to parent page
      return
    }

    // Otherwise, toggle the dropdown
    if (hasSubmenu) {
      e.preventDefault()
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Parent Item */}
      <motion.div whileHover={{ x: 4 }}>
        <Link
          href={item.href}
          onClick={handleToggle}
          className={cn(
            'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
            isParentActive
              ? 'from-brand-500 to-brand-600 shadow-soft bg-gradient-to-r text-white'
              : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1">{item.label}</span>

          {/* Badge */}
          {item.badge !== undefined && item.badge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-error-500 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
            >
              {item.badge}
            </motion.span>
          )}

          {/* Chevron for submenu */}
          {hasSubmenu && (
            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight
                className={cn('h-4 w-4', isParentActive ? 'text-white' : 'text-neutral-400')}
              />
            </motion.div>
          )}
        </Link>
      </motion.div>

      {/* Submenu */}
      <AnimatePresence>
        {hasSubmenu && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-9 space-y-1 border-l-2 border-neutral-200 pl-4 dark:border-neutral-700">
              {item.submenu?.map((subItem) => {
                const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href)

                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-sm transition-colors',
                      isSubActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400 font-medium'
                        : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                    )}
                  >
                    {subItem.label}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
