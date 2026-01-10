import { Markdown } from '@uni-feedback/ui'

interface FeedbackMarkdownProps {
  children: string
}

export function FeedbackMarkdown({ children }: FeedbackMarkdownProps) {
  return (
    <Markdown
      components={{
        h1: ({ ...props }) => (
          <h1
            {...props}
            className="text-xl font-semibold text-gray-900 mt-4 mb-3"
          />
        ),
        h2: ({ ...props }) => (
          <h2
            {...props}
            className="text-lg font-semibold text-gray-900 mt-3 mb-2"
          />
        ),
        h3: ({ ...props }) => (
          <h3
            {...props}
            className="text-lg font-semibold text-gray-900 mt-2 mb-1"
          />
        )
      }}
    >
      {children}
    </Markdown>
  )
}
