import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import * as React from 'react'
import { Markdown } from 'tiptap-markdown'
import { cn } from '../../../utils'
import { BubbleMenuBar } from './BubbleMenuBar'

export interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  disabled?: boolean
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'What should others know about this course?',
  className,
  minHeight = '150px',
  disabled = false
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3]
        }
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:h-0 before:pointer-events-none'
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true
      })
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown()
      onChange?.(markdown)
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'text-base text-gray-600',
          '[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-2 [&_h2]:mb-1',
          '[&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-2 [&_h3]:mb-1',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-0.5 [&_ul]:my-1',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-0.5 [&_ol]:my-1',
          '[&_li]:text-gray-600',
          '[&_p]:mb-1'
        )
      }
    }
  })

  // Update editor content when value changes externally
  React.useEffect(() => {
    if (editor && value !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  // Update editable state when disabled changes
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [editor, disabled])

  return (
    <div
      className={cn(
        'w-full border rounded-md bg-white overflow-hidden',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {editor ? (
        <div
          className="cursor-text"
          style={{ minHeight }}
          onClick={() => editor.chain().focus().run()}
        >
          <BubbleMenuBar editor={editor} />
          <EditorContent editor={editor} className="p-3" />
        </div>
      ) : (
        <div className="p-3 text-sm text-gray-400" style={{ minHeight }}>
          {placeholder}
        </div>
      )}
    </div>
  )
}
