import { CircleHelp } from 'lucide-react'
import * as React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea
} from '../shadcn'
import { Markdown } from './Markdown'

interface MarkdownTextareaProps extends React.ComponentProps<'textarea'> {
  previewPlaceholder?: string
}

export function MarkdownTextarea({
  previewPlaceholder = 'Nothing to preview...',
  ...props
}: MarkdownTextareaProps) {
  return (
    <div className="w-full border rounded-md bg-white">
      <Tabs defaultValue="markdown" className="gap-0">
        <div className="flex items-center py-1 px-3">
          <TabsList className="flex space-x-1 rounded-none bg-transparent">
            <TabsTrigger
              value="markdown"
              className="px-4 py-2 font-medium rounded-full data-[state=active]:bg-gray-100 cursor-pointer  hover:border-gray-200"
            >
              Write
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="px-4 py-2 font-medium rounded-full data-[state=active]:bg-gray-100 cursor-pointer  hover:border-gray-200"
            >
              Preview
            </TabsTrigger>
          </TabsList>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="ml-1 cursor-pointer"
              >
                <CircleHelp className="size-4 text-gray-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-sm">
              <p className="font-semibold mb-2">What's this?</p>
              <p className="text-gray-600 mb-3">
                You can format your text to make it easier to read.
              </p>
              <p className="text-gray-600 mb-3">
                You write normally. A few simple symbols turn into formatting
                when you hit Preview.
              </p>
              <p className="font-medium mb-2">Examples:</p>
              <div className="space-y-1 font-mono text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">**Bold text**</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-bold">Bold text</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">*Italic text*</span>
                  <span className="text-gray-400">→</span>
                  <span className="italic">Italic text</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">- Item</span>
                  <span className="text-gray-400">→</span>
                  <span>• Item</span>
                </div>
              </div>
              <p className="text-gray-600 mb-3">
                This formatting is called Markdown.
              </p>
              <a
                href="https://www.markdownguide.org/cheat-sheet/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-primaryBlue hover:text-primaryBlue/80 font-medium text-xs"
              >
                Learn More
              </a>
            </PopoverContent>
          </Popover>
        </div>
        <TabsContent value="markdown">
          <Textarea
            {...props}
            className="w-full min-h-[120px] max-h-[300px] rounded-md rounded-t-none p-2 resize-y text-sm overflow-auto"
            placeholder={
              props.placeholder || 'Use Markdown to format your comment'
            }
          />
        </TabsContent>
        <TabsContent value="preview">
          <div className="w-full min-h-[120px] max-h-[300px] border rounded-md rounded-t-none p-2 overflow-auto">
            <Markdown className="markdown-compact">
              {String(props.value || previewPlaceholder)}
            </Markdown>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
