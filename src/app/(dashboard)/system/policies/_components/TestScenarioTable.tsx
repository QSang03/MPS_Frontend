import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import type { PolicyTestScenario } from '@/types/policies'
import { Copy, CheckCheck } from 'lucide-react'

interface TestScenarioTableProps {
  scenarios: PolicyTestScenario[]
}

export function TestScenarioTable({ scenarios }: TestScenarioTableProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = async (scenario: PolicyTestScenario, index: number) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(scenario, null, 2))
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    } catch (error) {
      console.error('Copy scenario failed', error)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Expected</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scenarios.map((scenario, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <pre className="text-xs whitespace-pre-wrap text-slate-600">
                  {JSON.stringify(scenario.subject, null, 2)}
                </pre>
              </TableCell>
              <TableCell className="font-semibold">{scenario.action}</TableCell>
              <TableCell>
                <pre className="text-xs whitespace-pre-wrap text-slate-600">
                  {JSON.stringify(scenario.resource, null, 2)}
                </pre>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    scenario.expected === 'ALLOW'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {scenario.expected}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(scenario, idx)}
                  className="hover:text-indigo-600"
                >
                  {copiedIndex === idx ? (
                    <CheckCheck className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
