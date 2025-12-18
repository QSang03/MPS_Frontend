'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { FileText, Loader2 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface ReportGeneratorProps {
  customerId: string
}

const reportTypesBase = [
  { value: 'monthly-usage', labelKey: 'reports.types.monthly_usage' },
  { value: 'device-performance', labelKey: 'reports.types.device_performance' },
  { value: 'service-summary', labelKey: 'reports.types.service_summary' },
  { value: 'cost-analysis', labelKey: 'reports.types.cost_analysis' },
]

export function ReportGenerator({}: ReportGeneratorProps) {
  const { t } = useLocale()
  const [reportType, setReportType] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const reportTypes = reportTypesBase.map((type) => ({
    ...type,
    label: t(type.labelKey),
  }))

  const handleGenerate = async () => {
    if (!reportType) {
      toast.error(t('reports.generator.select_type_error'))
      return
    }

    setIsGenerating(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsGenerating(false)
    toast.success(t('reports.generator.success'))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('reports.generator.type_label')}</Label>
        <Select value={reportType} onValueChange={setReportType} disabled={isGenerating}>
          <SelectTrigger>
            <SelectValue placeholder={t('reports.generator.type_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {reportTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('reports.generator.generating')}
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            {t('reports.generator.generate_button')}
          </>
        )}
      </Button>
    </div>
  )
}
