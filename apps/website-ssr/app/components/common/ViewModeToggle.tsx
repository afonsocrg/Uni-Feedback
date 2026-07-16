import { Popover, PopoverContent, PopoverTrigger } from '@uni-feedback/ui'
import { Check, LayoutGrid, List } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'
import type { ListingSurface, ViewMode } from '~/utils/analytics'
import { analytics } from '~/utils/analytics'

/**
 * The listing students get before touching the toggle, on every browse page.
 *
 * `listing_view_mode_changed` is only meaningful against this: every event is a
 * student leaving this default, so flipping it re-bases that metric rather than
 * continuing it.
 */
export const DEFAULT_VIEW_MODE: ViewMode = 'list'

/**
 * Switches a browse page between its card grid and its compact list.
 *
 * Deliberately the quietest control in the filter row: a bare icon of the
 * current view, no border and no fill, opening a popover to change it. It sits
 * beside the filters but is not one, and it is a preference a student sets once
 * and forgets, so it should never compete with the listing for attention.
 *
 * Owns its own analytics on purpose: the event is what tells us whether the
 * list default is holding, and instrumenting it here means a second page cannot
 * adopt the toggle and silently forget to report.
 */
export function ViewModeToggle({
  value,
  onChange,
  surface
}: {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  surface: ListingSurface
}) {
  const { t } = useTranslation('browse')
  const [open, setOpen] = useState(false)

  const options: { value: ViewMode; label: string; icon: typeof List }[] = [
    { value: 'cards', label: t('listing.view_cards'), icon: LayoutGrid },
    { value: 'list', label: t('listing.view_list'), icon: List }
  ]

  const current = options.find((option) => option.value === value) ?? options[1]
  const CurrentIcon = current.icon

  const handleSelect = (mode: ViewMode) => {
    onChange(mode)
    setOpen(false)
    analytics.discovery.viewModeChanged({
      viewMode: mode,
      surface,
      defaultViewMode: DEFAULT_VIEW_MODE
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // The icon alone names nothing, and the current view is a state a
          // screen reader has no other way to read off this control.
          aria-label={`${t('listing.view_label')}: ${current.label}`}
          className="flex flex-shrink-0 cursor-pointer items-center rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <CurrentIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-2" align="end" sideOffset={8}>
        {options.map((option) => {
          const OptionIcon = option.icon
          const isSelected = option.value === value

          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors flex items-center gap-2',
                isSelected
                  ? 'bg-primaryBlue/10 text-primaryBlue font-medium'
                  : 'text-foreground'
              )}
            >
              <OptionIcon className="h-4 w-4 flex-shrink-0" />
              <span>{option.label}</span>
              {isSelected && <Check className="ml-auto h-4 w-4" />}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
