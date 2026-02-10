'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Headphones, X, Phone, Mail, User } from 'lucide-react'
import { useCustomerManagers } from '@/lib/hooks/useCustomerManagers'
import { useLocale } from '@/components/providers/LocaleProvider'
import { usePathname } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default function ContactBox() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useLocale()

  // Only show on user routes
  const isUserRoute = pathname?.startsWith('/user')
  const { data: managers = [], isLoading } = useCustomerManagers({
    enabled: isUserRoute,
  })

  // Don't render if not on user route or no managers
  if (!isUserRoute || (!isLoading && managers.length === 0)) {
    return null
  }

  return (
    <div className="safe-area-bottom fixed right-3 bottom-3 z-50 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 bottom-14 mb-2 w-[calc(100vw-1.5rem)] max-w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:bottom-16 sm:w-80"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-white" />
                  <span className="font-semibold text-white">
                    {t('navbar.customerManager.title') || 'Hỗ trợ khách hàng'}
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-3 sm:max-h-80">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-600)] border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-3">
                  {managers.map((manager) => (
                    <div
                      key={manager.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    >
                      {/* Manager info */}
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-100)] text-[var(--brand-700)]">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-800">
                            {manager.fullName}
                          </p>
                          {manager.role && (
                            <p className="truncate text-xs text-gray-500">{manager.role}</p>
                          )}
                        </div>
                      </div>

                      {/* Contact actions */}
                      <div className="flex flex-wrap gap-2">
                        {manager.phone && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={`tel:${manager.phone}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-200"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  {manager.phone}
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('navbar.customerManager.phone') || 'Gọi điện'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {manager.email && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={`mailto:${manager.email}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  <span className="max-w-[120px] truncate">{manager.email}</span>
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('navbar.customerManager.email') || 'Gửi email'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
              <p className="text-center text-xs text-gray-500">
                {t('navbar.customerManager.helpText') || 'Liên hệ để được hỗ trợ nhanh nhất'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors sm:h-14 sm:w-14 ${
          isOpen
            ? 'bg-gray-600 text-white'
            : 'bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] text-white'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <Headphones className="h-6 w-6" />
            {managers.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                {managers.length}
              </span>
            )}
          </div>
        )}
      </motion.button>
    </div>
  )
}
