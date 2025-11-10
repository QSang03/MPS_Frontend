'use client'

import React from 'react'
import { DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/lib/store/uiStore'

const PRESET_COLORS = [
  '#0ea5e9', // sky
  '#06b6d4', // cyan
  '#7c3aed', // purple
  '#ef4444', // red
  '#10b981', // green
]

export default function SettingsPanel() {
  const themeColor = useUIStore((s) => s.themeColor)
  const setThemeColor = useUIStore((s) => s.setThemeColor)
  const fontFamily = useUIStore((s) => s.fontFamily)
  const setFontFamily = useUIStore((s) => s.setFontFamily)

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Thiết lập giao diện</DialogTitle>
        <DialogDescription>
          Chọn màu chủ đạo và font hiển thị cho giao diện của bạn.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Màu chủ đạo</p>
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                aria-label={c}
                className={`h-8 w-8 rounded-md shadow-sm ring-2 ${themeColor === c ? 'ring-black/10 ring-offset-2' : 'ring-transparent'}`}
                onClick={() => setThemeColor(c)}
                style={{ background: c }}
              />
            ))}
            <input
              aria-label="Custom color"
              type="color"
              className="h-8 w-12 rounded-md"
              value={themeColor || '#0ea5e9'}
              onChange={(e) => setThemeColor(e.target.value)}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Font chữ</p>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="font"
                checked={fontFamily === 'inter'}
                onChange={() => setFontFamily('inter')}
              />
              <span>Inter</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="font"
                checked={fontFamily === 'poppins'}
                onChange={() => setFontFamily('poppins')}
              />
              <span>Poppins</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="font"
                checked={fontFamily === 'mono'}
                onChange={() => setFontFamily('mono')}
              />
              <span>Mono</span>
            </label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              // reset
              setThemeColor('')
              setFontFamily('inter')
            }}
          >
            Khôi phục
          </Button>
          <Button>Áp dụng</Button>
        </div>
      </DialogFooter>
    </div>
  )
}
