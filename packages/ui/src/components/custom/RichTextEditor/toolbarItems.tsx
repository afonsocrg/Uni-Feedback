import type { Editor } from '@tiptap/react'
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered
} from 'lucide-react'
import * as React from 'react'

/** Identifies a formatting action in analytics. */
export type ToolbarFormat =
  | 'bold'
  | 'italic'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'

export interface ToolbarItem {
  format: ToolbarFormat
  title: string
  icon: React.ReactNode
  isActive: boolean
  run: () => void
  /** Marks the start of a visual group (renders a divider before it). */
  startsGroup?: boolean
}

/**
 * The single definition of the editor's formatting actions, shared by the
 * floating bubble menu and the inline toolbar so the two can never drift.
 */
export function getToolbarItems(editor: Editor): ToolbarItem[] {
  return [
    {
      format: 'bold',
      title: 'Bold',
      icon: <Bold className="size-4" />,
      isActive: editor.isActive('bold'),
      run: () => editor.chain().focus().toggleBold().run()
    },
    {
      format: 'italic',
      title: 'Italic',
      icon: <Italic className="size-4" />,
      isActive: editor.isActive('italic'),
      run: () => editor.chain().focus().toggleItalic().run()
    },
    {
      format: 'heading2',
      title: 'Heading 2',
      icon: <Heading2 className="size-4" />,
      isActive: editor.isActive('heading', { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      startsGroup: true
    },
    {
      format: 'heading3',
      title: 'Heading 3',
      icon: <Heading3 className="size-4" />,
      isActive: editor.isActive('heading', { level: 3 }),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
      format: 'bulletList',
      title: 'Bullet List',
      icon: <List className="size-4" />,
      isActive: editor.isActive('bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run(),
      startsGroup: true
    },
    {
      format: 'orderedList',
      title: 'Ordered List',
      icon: <ListOrdered className="size-4" />,
      isActive: editor.isActive('orderedList'),
      run: () => editor.chain().focus().toggleOrderedList().run()
    }
  ]
}
