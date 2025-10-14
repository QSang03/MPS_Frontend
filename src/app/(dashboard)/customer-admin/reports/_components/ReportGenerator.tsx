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

interface ReportGeneratorProps {
  customerId: string
}

const reportTypes = [
  { value: 'monthly-usage', label: 'Monthly Usage Report' },
  { value: 'device-performance', label: 'Device Performance Report' },
  { value: 'service-summary', label: 'Service Request Summary' },
  { value: 'cost-analysis', label: 'Cost Analysis Report' },
]

export function ReportGenerator({}: ReportGeneratorProps) {
  const [reportType, setReportType] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!reportType) {
      toast.error('Please select a report type')
      return
    }

    setIsGenerating(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsGenerating(false)
    toast.success('Report generated successfully! Check Recent Reports.')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Report Type</Label>
        <Select value={reportType} onValueChange={setReportType} disabled={isGenerating}>
          <SelectTrigger>
            <SelectValue placeholder="Select report type" />
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
            Generating...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </>
        )}
      </Button>
    </div>
  )
}
