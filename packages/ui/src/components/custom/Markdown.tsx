import type { Components, Options } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  children: string
  className?: string
  components?: Partial<Components>
}

/**
 * Disables indented code blocks (4+ leading spaces).
 *
 * Nobody here writes code in markdown, but students routinely indent lines to
 * visually offset a list or a paragraph. Parsed as code, that text renders
 * monospaced and never wraps, so it overflows its container. Fenced blocks
 * (```) still work.
 */
const remarkNoIndentedCode: NonNullable<Options['remarkPlugins']>[number] =
  function () {
    const data = (
      this as unknown as {
        data: () => { micromarkExtensions?: unknown[] }
      }
    ).data()
    const extensions = (data.micromarkExtensions ??= [])
    extensions.push({ disable: { null: ['codeIndented'] } })
  }

const defaultComponents: Components = {
  a: ({ ...props }) => {
    const href = props.href
    const isExternal = href?.startsWith('http') || href?.startsWith('www.')

    // Make sure external links start with https://
    const fullHref = href?.startsWith('www.') ? `https://${href}` : href

    return (
      <a
        {...props}
        href={fullHref}
        className="text-primaryBlue hover:underline hover:text-primaryBlue/80"
        {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
      />
    )
  },
  h1: ({ ...props }) => (
    <h1 {...props} className="text-2xl font-bold text-foreground mt-4 mb-4" />
  ),
  h2: ({ ...props }) => (
    <h2 {...props} className="text-xl font-bold text-foreground mt-3 mb-3" />
  ),
  h3: ({ ...props }) => (
    <h3 {...props} className="text-lg font-bold text-foreground mt-2 mb-2" />
  ),
  ul: ({ ...props }) => (
    <ul {...props} className="list-disc pl-6 space-y-1 my-2" />
  ),
  ol: ({ ...props }) => (
    <ol {...props} className="list-decimal pl-6 space-y-1 my-2" />
  ),
  li: ({ ...props }) => <li {...props} className="text-muted-foreground" />,
  p: ({ ...props }) => <p {...props} className="mb-2" />,
  hr: () => <hr className="my-6 border-t-2 border-border rounded-full" />,
  pre: ({ ...props }) => (
    <pre
      {...props}
      className="my-2 overflow-x-auto whitespace-pre-wrap break-words"
    />
  ),
  code: ({ ...props }) => <code {...props} className="break-words" />
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
    <div
      className={`prose prose-sm text-muted-foreground max-w-none break-words ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkNoIndentedCode]}
        rehypePlugins={[rehypeRaw]}
        components={mergedComponents}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
