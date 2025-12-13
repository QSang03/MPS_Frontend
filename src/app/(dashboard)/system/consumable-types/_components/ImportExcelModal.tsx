'use client'

import React, { useState } from 'react'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Loader2, Upload } from 'lucide-react'
import ExcelJS from 'exceljs'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useQueryClient } from '@tanstack/react-query'

interface ImportExcelModalProps {
  trigger?: React.ReactNode
}

export default function ImportExcelModal({ trigger }: ImportExcelModalProps = {}) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewRows, setPreviewRows] = useState<
    Array<Record<string, string | number | undefined>>
  >([])
  const [headerValid, setHeaderValid] = useState<boolean | null>(null)
  const queryClient = useQueryClient()
  const { t } = useLocale()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f) parsePreview(f)
  }

  const parsePreview = async (f: File) => {
    try {
      setPreviewRows([])
      setHeaderValid(null)
      const buf = await f.arrayBuffer()
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buf)
      const sheet = workbook.worksheets[0]
      if (!sheet) {
        setHeaderValid(false)
        return
      }

      const headerRow = sheet.getRow(1)
      const headers = [
        headerRow.getCell(1).text,
        headerRow.getCell(2).text,
        headerRow.getCell(3).text,
        headerRow.getCell(4).text,
      ].map((h) =>
        String(h || '')
          .trim()
          .toLowerCase()
      )
      const expected = ['part', 'tên', 'sản lượng', 'dòng máy tương thích']
      const ok = expected.every(
        (exp, idx) =>
          (headers[idx] && headers[idx].includes(exp.replace(/\s+/g, '').replace('sản', 'san'))) ||
          headers[idx] === exp
      )
      setHeaderValid(ok)

      const rows: Array<Record<string, string | number | undefined>> = []
      const maxPreview = Math.min(10, sheet.rowCount - 1)
      for (let i = 2; i <= 1 + maxPreview; i++) {
        const r = sheet.getRow(i)
        if (!r) continue
        const rawPart = r.getCell(1).text ?? r.getCell(1).value
        const rawName = r.getCell(2).text ?? r.getCell(2).value
        const rawCapacity = r.getCell(3).text ?? r.getCell(3).value
        const rawCompatible = r.getCell(4).text ?? r.getCell(4).value

        const part = rawPart === undefined || rawPart === null ? undefined : String(rawPart)
        const name = rawName === undefined || rawName === null ? undefined : String(rawName)
        const capacity =
          rawCapacity === undefined || rawCapacity === null ? undefined : String(rawCapacity)
        const compatible =
          rawCompatible === undefined || rawCompatible === null ? undefined : String(rawCompatible)

        if (!part && !name && !capacity && !compatible) continue
        rows.push({ part, name, capacity, compatible, row: i })
      }

      setPreviewRows(rows)
    } catch (err) {
      console.error('Failed to parse excel preview', err)
      setHeaderValid(false)
      setPreviewRows([])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error(t('consumable_types.import.errors.no_file'))
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/consumable-types/import/excel', {
        method: 'POST',
        body: fd,
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        const msg = data?.error || data?.message || t('consumable_types.import.errors.failed')
        toast.error(String(msg))
        return
      }

      // Success - backend should return summary
      toast.success(t('consumable_types.import.success'))
      queryClient.invalidateQueries({ queryKey: ['consumable-types'] })
      setOpen(false)
      setFile(null)
    } catch (err) {
      console.error('Import error', err)
      toast.error(t('consumable_types.import.errors.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 hover:bg-[var(--accent)]">
            <FileText className="h-4 w-4" />
            {t('consumable_types.import.button')}
          </Button>
        </DialogTrigger>
      )}

      <SystemModalLayout
        title={t('consumable_types.import.title')}
        description={t('consumable_types.import.description')}
        icon={Upload}
        variant="create"
        maxWidth="!max-w-[55vw]"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                setFile(null)
              }}
              className="min-w-[100px]"
            >
              {t('button.cancel')}
            </Button>
            <Button
              variant="default"
              onClick={handleUpload}
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('consumable_types.import.upload')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold">
              {t('consumable_types.import.select_file')}
            </label>
            <div className="flex items-center gap-2">
              <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="mt-2" />
              <Button
                variant="default"
                onClick={async () => {
                  // generate template and download
                  try {
                    const workbook = new ExcelJS.Workbook()
                    const sheet = workbook.addWorksheet('Template')
                    sheet.addRow([
                      t('consumable_types.import.template.part'),
                      t('consumable_types.import.template.name'),
                      t('consumable_types.import.template.capacity'),
                      t('consumable_types.import.template.compatible'),
                    ])
                    sheet.addRow(['ABC-123', 'Mực in', 1000, 'Model A; Model B'])
                    sheet.addRow(['DEF-456', 'Bộ lọc', 500, 'Model C'])
                    sheet.columns = [{ width: 20 }, { width: 30 }, { width: 15 }, { width: 40 }]
                    const buf = await workbook.xlsx.writeBuffer()
                    const blob = new Blob([buf], {
                      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'consumable-types-template.xlsx'
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(url)
                  } catch (err) {
                    console.error('Failed to generate template', err)
                    toast.error(t('consumable_types.import.errors.template_failed'))
                  }
                }}
                className="mt-2"
              >
                {t('consumable_types.import.download_template')}
              </Button>
            </div>
            {file && <div className="text-muted-foreground mt-2 text-sm">{file.name}</div>}
          </div>

          <div>
            <label className="block text-sm font-semibold">
              {t('consumable_types.import.preview.title')}
            </label>
            <div className="mt-2">
              {headerValid === false && (
                <div className="text-sm text-red-600">
                  {t('consumable_types.import.errors.invalid_header')}
                </div>
              )}
              {previewRows.length === 0 && headerValid !== false && (
                <div className="text-muted-foreground text-sm">
                  {t('consumable_types.import.preview.empty')}
                </div>
              )}
              {previewRows.length > 0 && (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="px-2 py-1">#</th>
                        <th className="px-2 py-1">{t('consumable_types.import.template.part')}</th>
                        <th className="px-2 py-1">{t('consumable_types.import.template.name')}</th>
                        <th className="px-2 py-1">
                          {t('consumable_types.import.template.capacity')}
                        </th>
                        <th className="px-2 py-1">
                          {t('consumable_types.import.template.compatible')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1">{(r.row as number) ?? idx + 2}</td>
                          <td className="px-2 py-1">{String(r.part ?? '—')}</td>
                          <td className="px-2 py-1">{String(r.name ?? '—')}</td>
                          <td className="px-2 py-1">{String(r.capacity ?? '—')}</td>
                          <td className="px-2 py-1">{String(r.compatible ?? '—')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
