'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Code } from 'lucide-react'

interface TemplateVariablePickerProps {
  onSelect: (variable: string) => void
  disabled?: boolean
}

const TEMPLATE_VARIABLES = [
  { value: '{{user.id}}', label: '{{user.id}}', description: 'ID của user hiện tại' },
  {
    value: '{{user.customerId}}',
    label: '{{user.customerId}}',
    description: 'Customer ID của user hiện tại',
  },
  { value: '{{user.email}}', label: '{{user.email}}', description: 'Email của user hiện tại' },
]

export function TemplateVariablePicker({
  onSelect,
  disabled = false,
}: TemplateVariablePickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (variable: string) => {
    onSelect(variable)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-8 w-8"
          title="Chèn template variable"
        >
          <Code className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {TEMPLATE_VARIABLES.map((variable) => (
          <DropdownMenuItem
            key={variable.value}
            onClick={() => handleSelect(variable.value)}
            className="flex flex-col items-start"
          >
            <span className="font-mono text-sm font-semibold">{variable.label}</span>
            <span className="text-xs text-gray-500">{variable.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Check xem field có hỗ trợ template variables không
 */
export function supportsTemplateVariables(
  type: 'subject' | 'resource' | 'condition',
  field: string
): boolean {
  if (type === 'condition') return false // Conditions không hỗ trợ template variables

  // Subject fields hỗ trợ template
  if (type === 'subject') {
    return ['user.customerId', 'user.id'].includes(field)
  }

  // Resource fields hỗ trợ template
  if (type === 'resource') {
    return ['customerId'].includes(field)
  }

  return false
}
