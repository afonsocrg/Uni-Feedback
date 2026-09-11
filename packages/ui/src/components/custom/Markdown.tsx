import type { Components, Options } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
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

/**
 * What raw HTML is allowed to survive.
 *
 * `rehypeRaw` turns inline HTML in the source into real elements, which is
 * wanted for the odd `<br>` or `<sup>` in a scraped course description. It is
 * also how a student-written review, or a chat answer that quotes one, could
 * carry an `<iframe>`, a `<form>`, a `<style>` overlay or an `on*` handler into
 * every reader's page. So everything `rehypeRaw` produces goes through the
 * GitHub sanitising schema next: known-safe tags and attributes only, `href`
 * limited to http(s)/mailto/relative, no scripts, no event handlers, no styles.
 *
 * Presentation is unaffected: the components below add their classes AFTER
 * sanitising, in React, so nothing here strips them. The schema also prefixes
 * any `id` with `user-content-`, which is what stops injected markup from
 * shadowing the page's own anchors.
 *
 * Order matters: sanitise has to run after raw, or it sanitises a tree the
 * raw HTML has not been parsed into yet.
 *
 * Images are removed on top of the GitHub schema, which allows them. An
 * `<img>` is a request to whatever host the markup names, which hands the
 * reader's address and user agent to whoever wrote the review, and on the
 * server React even emits a preload hint for it. No content on the site uses
 * images in markdown (checked 2026-09-11: none in reviews, course or degree
 * text, legal pages or locales), so nothing is lost.
 */
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: (defaultSchema.tagNames ?? []).filter((tag) => tag !== 'img')
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
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={mergedComponents}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
