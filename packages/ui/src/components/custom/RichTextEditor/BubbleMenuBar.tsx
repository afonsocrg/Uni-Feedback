import { BubbleMenu, type Editor } from '@tiptap/react'
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered
} from 'lucide-react'
import * as React from 'react'

interface BubbleMenuBarProps {
  editor: Editor
}

export function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      shouldShow={({ editor }) => !editor.state.selection.empty}
      className="bg-gray-900 rounded-lg shadow-lg flex items-center gap-0.5 p-1"
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <Bold className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <Italic className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
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
