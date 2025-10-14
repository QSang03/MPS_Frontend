'use client'

import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatters'
import { toast } from 'sonner'

interface ReportHistoryProps {
  customerId: string
}

// Mock data
const mockReports = [
  {
    id: '1',
    name: 'Monthly Usage Report - September 2025',
    type: 'monthly-usage',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Device Performance Report - Q3 2025',
    type: 'device-performance',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export function ReportHistory({}: ReportHistoryProps) {
  const handleDownload = (reportId: string, name: string) => {
    toast.success(`Downloading: ${name}`)
    // Implement actual download logic here
  }

  return (
    <div className="space-y-3">
      {mockReports.map((report) => (
        <div key={report.id} className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{report.name}</p>
              <p className="text-muted-foreground text-xs">
                Generated: {formatDateTime(report.createdAt)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(report.id, report.name)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      ))}
      {mockReports.length === 0 && (
        <div className="text-muted-foreground flex h-32 items-center justify-center rounded-md border-2 border-dashed">
          <p>No reports generated yet</p>
        </div>
      )}
    </div>
  )
}
