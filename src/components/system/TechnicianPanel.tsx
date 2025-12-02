'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/app/(dashboard)/system/policies/_components/RuleBuilder/SearchableSelect'
import { useState } from 'react'

interface Props {
  customerId?: string | undefined
  assignedTo?: string | null
  assignedToName?: string | null
  onAssign: (payload: { assignedTo: string; actionNote?: string }) => void
  disabled?: boolean
}

export function TechnicianPanel({
  customerId,
  assignedTo,
  assignedToName,
  onAssign,
  disabled,
}: Props) {
  const [selected, setSelected] = useState<string | undefined>(assignedTo ?? undefined)
  const [note, setNote] = useState('')

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Kỹ thuật viên phụ trách</div>
      <SearchableSelect
        field="user.id"
        operator="$eq"
        value={selected}
        onChange={(v) => setSelected(v as string)}
        placeholder={assignedToName ?? 'Chọn nhân viên...'}
        fetchParams={customerId ? { customerId } : undefined}
        disabled={disabled}
      />
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ghi chú phân công (tùy chọn)..."
        rows={3}
      />
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={() => {
          if (!selected) return
          onAssign({ assignedTo: selected, actionNote: note?.trim() || undefined })
          setNote('')
        }}
        disabled={disabled}
      >
        Lưu phân công
      </Button>
    </div>
  )
}

export default TechnicianPanel
