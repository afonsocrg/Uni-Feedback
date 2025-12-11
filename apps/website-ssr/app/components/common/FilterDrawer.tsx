import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@uni-feedback/ui'
import type { ReactNode } from 'react'

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  onClearFilters?: () => void
}

export function FilterDrawer({
  open,
  onClose,
  title,
  children,
  onClearFilters
}: FilterDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-bold">{title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">{children}</div>

        {onClearFilters && (
          <div className="mt-8 pt-6 border-t sticky bottom-0 bg-white">
            <Button
              variant="outline"
              className="w-full"
              onClick={onClearFilters}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
