import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button
} from '@uni-feedback/ui'
import { HelpCircle, Plus, X } from 'lucide-react'
import { ReactNode } from 'react'

interface EditableBadgeListProps {
  label: string
  items: string[]
  onAdd: () => void
  onRemove: (item: string) => void
  addButtonLabel: string
  emptyMessage?: string
  tooltip?: string
  prefix?: string
  isLoading?: boolean
  removeConfirmDialog?: {
    isOpen: boolean
    itemToRemove: string
    title: string
    description: string
    onConfirm: () => void
    onCancel: () => void
    isRemoving?: boolean
  }
  addDialog?: ReactNode
}

export function EditableBadgeList({
  label,
  items,
  onAdd,
  onRemove,
  addButtonLabel,
  emptyMessage,
  tooltip,
  prefix = '',
  isLoading = false,
  removeConfirmDialog,
  addDialog
}: EditableBadgeListProps) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <dt className="font-medium text-sm">{label}</dt>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <dd className="flex flex-wrap gap-2">
          {items && items.length > 0
            ? items.map((item, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="font-mono group hover:bg-destructive/10 transition-colors"
                >
                  {prefix}
                  {item}
                  <button
                    onClick={() => onRemove(item)}
                    className="ml-2 hover:text-destructive transition-colors"
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            : null}

          {/* Add Badge */}
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-accent/50 transition-colors border-dashed"
            onClick={onAdd}
          >
            <Plus className="h-3 w-3 mr-1" />
            {addButtonLabel}
          </Badge>
        </dd>

        {(!items || items.length === 0) && emptyMessage && (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </div>

      {/* Remove Confirmation Dialog */}
      {removeConfirmDialog && (
        <Dialog
          open={removeConfirmDialog.isOpen}
          onOpenChange={(open) => !open && removeConfirmDialog.onCancel()}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{removeConfirmDialog.title}</DialogTitle>
              <DialogDescription>
                {removeConfirmDialog.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={removeConfirmDialog.onCancel}
                disabled={removeConfirmDialog.isRemoving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={removeConfirmDialog.onConfirm}
                disabled={removeConfirmDialog.isRemoving}
              >
                {removeConfirmDialog.isRemoving ? 'Removing...' : 'Remove'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Dialog */}
      {addDialog}
    </>
  )
}
