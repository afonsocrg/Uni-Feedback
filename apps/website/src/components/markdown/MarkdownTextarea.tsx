import * as React from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Markdown } from '@components'
import {
  Button,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@ui'
import { CircleHelp } from 'lucide-react'

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
        <div className="flex items-center justify-between py-1 px-3">
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
              Markdown Preview
            </TabsTrigger>
          </TabsList>
          <span className="text-gray-500 text-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="link"
                    size="xs"
                    onClick={(e) => {
                      e.preventDefault()
                      window.open(
                        'https://www.markdownguide.org/cheat-sheet/',
                        '_blank'
                      )
                    }}
                  >
                    <CircleHelp className="size-4 text-gray-500" />
                    {/* What is Markdown? */}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Learn Markdown!</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
        </div>
        <TabsContent value="markdown">
          <Textarea
            {...props}
            className="w-full min-h-[120px] rounded-md rounded-t-none p-2 resize-y text-sm"
            placeholder={
              props.placeholder || 'Use Markdown to format your comment'
            }
          />
        </TabsContent>
        <TabsContent value="preview">
          <div className="w-full min-h-[120px] border rounded-md rounded-t-none p-2">
            <Markdown className="markdown-compact">
              {String(props.value || previewPlaceholder)}
            </Markdown>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
