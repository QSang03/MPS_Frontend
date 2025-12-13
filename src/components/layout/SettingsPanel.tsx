'use client'

import React, { useState, useEffect } from 'react'
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/lib/store/uiStore'
import { THEME_PRESETS } from '@/lib/theme-utils'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Check } from 'lucide-react'

export default function SettingsPanel() {
  const themeId = useUIStore((s) => s.themeId)
  const setThemeId = useUIStore((s) => s.setThemeId)
  const fontFamily = useUIStore((s) => s.fontFamily)
  const setFontFamily = useUIStore((s) => s.setFontFamily)

  // Local state for preview before applying
  const [localThemeId, setLocalThemeId] = useState(themeId || 'sky')
  const [localFontFamily, setLocalFontFamily] = useState(fontFamily || 'inter')
  const { t } = useLocale()

  // Sync local state when store changes (e.g., on dialog open)
  useEffect(() => {
    const newTheme = themeId || 'sky'
    const newFont = fontFamily || 'inter'
    const id = setTimeout(() => {
      setLocalThemeId((prev) => (prev === newTheme ? prev : newTheme))
      setLocalFontFamily((prev) => (prev === newFont ? prev : newFont))
    }, 0)
    return () => clearTimeout(id)
  }, [themeId, fontFamily])

  const handleApply = () => {
    setThemeId(localThemeId)
    setFontFamily(localFontFamily)
    toast.success(t('settings.applied'))
  }

  const handleReset = () => {
    setLocalThemeId('sky')
    setLocalFontFamily('inter')
    setThemeId('sky')
    setFontFamily('inter')
    toast.success(t('settings.reset_default'))
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Thiết lập giao diện</DialogTitle>
        <DialogDescription>
          Chọn theme màu sắc và font hiển thị cho giao diện của bạn.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-5">
        {/* Theme selection */}
        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">Chọn giao diện</p>
          <div className="grid grid-cols-3 gap-3">
            {THEME_PRESETS.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setLocalThemeId(theme.id)}
                className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                  localThemeId === theme.id
                    ? 'border-gray-900 bg-gray-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Color preview circles */}
                <div className="flex gap-1">
                  <div
                    className="h-5 w-5 rounded-full shadow-inner"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div
                    className="h-5 w-5 rounded-full shadow-inner"
                    style={{ backgroundColor: theme.colors.brand300 }}
                  />
                  <div
                    className="h-5 w-5 rounded-full shadow-inner"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                </div>
                {/* Theme name */}
                <span className="text-xs font-medium text-gray-700">{theme.name}</span>
                {/* Selected indicator */}
                {localThemeId === theme.id && (
                  <div className="absolute -top-1 -right-1 rounded-full bg-gray-900 p-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font selection */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Font chữ</p>
          <div className="flex items-center gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="font"
                checked={localFontFamily === 'inter'}
                onChange={() => setLocalFontFamily('inter')}
                className="h-4 w-4 accent-gray-900"
              />
              <span style={{ fontFamily: 'Inter, sans-serif' }}>Inter</span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="font"
                checked={localFontFamily === 'roboto'}
                onChange={() => setLocalFontFamily('roboto')}
                className="h-4 w-4 accent-gray-900"
              />
              <span style={{ fontFamily: 'Roboto, sans-serif' }}>Roboto</span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="font"
                checked={localFontFamily === 'mono'}
                onChange={() => setLocalFontFamily('mono')}
                className="h-4 w-4 accent-gray-900"
              />
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>Mono</span>
            </label>
          </div>
        </div>
      </div>

      <DialogFooter className="mt-6">
        <div className="flex w-full justify-end gap-2">
          <Button variant="secondary" onClick={handleReset}>
            Khôi phục
          </Button>
          <DialogClose asChild>
            <Button onClick={handleApply}>Áp dụng</Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </div>
  )
}
