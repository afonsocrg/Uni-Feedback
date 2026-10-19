import type { ReactNode } from 'react'

/**
 * The filter row of a browse page.
 *
 * On mobile the chips scroll sideways instead of wrapping. A degree page can
 * show six of them, and wrapping pushed the listing itself further down on the
 * one screen size where vertical space is scarcest. They wrap normally from
 * `md` up, where the room exists and a scroll affordance would be worse.
 */
export function FilterRow({ filters }: { filters: ReactNode }) {
  // `[&>*]:flex-shrink-0` keeps each chip at its natural width: without it they
  // squash to fit rather than letting the row overflow, and nothing ever
  // scrolls. The chips' popovers are portaled to the body, so `overflow-x-auto`
  // here can't clip them.
  return (
    <div className="flex min-w-0 gap-2 overflow-x-auto scrollbar-hide [&>*]:flex-shrink-0 md:flex-wrap md:overflow-x-visible">
      {filters}
    </div>
  )
}
