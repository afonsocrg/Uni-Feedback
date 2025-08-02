import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  children: string
  className?: string
  components?: Partial<Components>
}

const defaultComponents: Components = {
  a: ({ ...props }) => (
    <a
      {...props}
      className="text-primaryBlue hover:underline hover:text-primaryBlue/80"
      target="_blank"
    />
  ),
  h1: ({ ...props }) => (
    <h1 {...props} className="text-2xl font-bold text-gray-900 mt-4 mb-4" />
  ),
  h2: ({ ...props }) => (
    <h2 {...props} className="text-xl font-bold text-gray-900 mt-3 mb-3" />
  ),
  h3: ({ ...props }) => (
    <h3 {...props} className="text-lg font-bold text-gray-900 mt-2 mb-2" />
  ),
  ul: ({ ...props }) => (
    <ul {...props} className="list-disc pl-6 space-y-1 my-2" />
  ),
  ol: ({ ...props }) => (
    <ol {...props} className="list-decimal pl-6 space-y-1 my-2" />
  ),
  li: ({ ...props }) => <li {...props} className="text-gray-600" />,
  p: ({ ...props }) => <p {...props} className="mb-2" />,
  hr: () => <hr className="my-6 border-t-2 border-gray-200 rounded-full" />
}

export function Markdown({
  children,
  className = '',
  components = {}
}: MarkdownProps) {
  const mergedComponents = {
    ...defaultComponents,
    ...components
  }

  return (
    <div className={`prose prose-sm text-gray-600 max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={mergedComponents}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}