import type { Editor } from '@tiptap/react'
import * as React from 'react'
import { cn } from '../../../utils'
import { getToolbarItems, type ToolbarFormat } from './toolbarItems'

interface MenuBarProps {
  editor: Editor
  onFormat?: (format: ToolbarFormat) => void
  className?: string
}

/**
 * Inline toolbar pinned above the editor. The bubble menu only appears once
 * text is selected, so students never found out the comment could be
 * formatted. This makes the affordance visible before they start typing.
 */
export function MenuBar({ editor, onFormat, className }: MenuBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 px-2 py-1 border-b border-border bg-muted/50',
        className
      )}
      // The wrapper focuses the editor on click; the toolbar is not the text area.
      onClick={(e) => e.stopPropagation()}
    >
      {getToolbarItems(editor).map((item) => (
        <React.Fragment key={item.format}>
          {item.startsGroup && <ToolbarDivider />}
          <ToolbarButton
            onClick={() => {
              item.run()
              onFormat?.(item.format)
            }}
            isActive={item.isActive}
            title={item.title}
          >
            {item.icon}
          </ToolbarButton>
        </React.Fragment>
      ))}
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      // Keep the caret where it is: mousedown would blur the editor first.
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        isActive
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-border mx-1" />
}
