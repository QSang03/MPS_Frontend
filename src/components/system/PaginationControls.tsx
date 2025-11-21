import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  className?: string
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className,
}: PaginationControlsProps) {
  const clampedTotalItems = Math.max(totalItems, 0)
  const hasItems = clampedTotalItems > 0
  const startItem = hasItems ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItem = hasItems ? Math.min(currentPage * itemsPerPage, clampedTotalItems) : 0
  const [pageInput, setPageInput] = React.useState(String(currentPage))

  React.useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInput)
      if (page >= 1 && page <= totalPages) {
        onPageChange(page)
      } else {
        setPageInput(String(currentPage))
      }
    }
  }

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput)
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
    } else {
      setPageInput(String(currentPage))
    }
  }

  return (
    <div
      className={cn(
        'bg-card flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>
            Hiển thị <strong className="text-foreground">{startItem}</strong> -{' '}
            <strong className="text-foreground">{endItem}</strong> trong tổng số{' '}
            <strong className="text-foreground">{totalItems}</strong>
          </span>
        </div>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Số mục mỗi trang:</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="Trang đầu"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 px-2">
          <span className="text-muted-foreground text-sm">Trang</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={handlePageInputChange}
            onKeyDown={handlePageInputKeyDown}
            onBlur={handlePageInputBlur}
            className="h-8 w-16 text-center"
          />
          <span className="text-muted-foreground text-sm">/ {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Trang cuối"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
