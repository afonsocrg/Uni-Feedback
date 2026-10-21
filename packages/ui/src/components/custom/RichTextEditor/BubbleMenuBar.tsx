import type { Editor } from '@tiptap/react'
import { BubbleMenu, type BubbleMenuProps } from '@tiptap/react/menus'
import * as React from 'react'
import { getToolbarItems, type ToolbarFormat } from './toolbarItems'

interface BubbleMenuBarProps {
  editor: Editor
  onFormat?: (format: ToolbarFormat) => void
}

// Module-level so their identity is stable: BubbleMenu dispatches a
// transaction whenever these props change, and the editor re-renders on every
// transaction, so inline values loop forever.
const MENU_OPTIONS = { placement: 'top', offset: 8 } as const
const showOnSelection: BubbleMenuProps['shouldShow'] = ({ editor }) =>
  !editor.state.selection.empty

export function BubbleMenuBar({ editor, onFormat }: BubbleMenuBarProps) {
  return (
    <BubbleMenu
      editor={editor}
      options={MENU_OPTIONS}
      shouldShow={showOnSelection}
      className="bg-gray-900 rounded-lg shadow-lg flex items-center gap-0.5 p-1"
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
    </BubbleMenu>
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
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? 'bg-white/20 text-white'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-600 mx-1" />
}
