import { Button } from '@uni-feedback/ui'
import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'

export interface MessagePageButton {
  label: string
  onClick?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  href?: string
  icon?: LucideIcon
}

export interface MessagePageProps {
  /** Main heading text */
  heading: string
  /** Message content - use this for custom layouts with points, icons, etc. */
  children: ReactNode
  /** Action buttons (stacked vertically) */
  buttons?: MessagePageButton[]
}

export function MessagePage({
  heading,
  children,
  buttons = []
}: MessagePageProps) {
  return (
    <main className="min-h-[90vh] flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-6 py-4">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-700">
                {heading}
              </h2>
            </div>

            {/* Message content area with default text styling */}
            <div className="text-base text-gray-500 space-y-4">{children}</div>
          </div>

          {/* Action Buttons */}
          {buttons.length > 0 && (
            <div className="text-center space-y-3">
              {buttons.map((button, index) => {
                const ButtonIcon = button.icon
                const buttonContent = (
                  <>
                    {ButtonIcon && <ButtonIcon className="size-4" />}
                    <span>{button.label}</span>
                  </>
                )

                if (button.href) {
                  return (
                    <Button
                      key={index}
                      variant={button.variant || 'default'}
                      asChild
                      className="w-full max-w-md"
                    >
                      <a
                        href={button.href}
                        className="inline-flex items-center gap-2"
                      >
                        {buttonContent}
                      </a>
                    </Button>
                  )
                }

                return (
                  <Button
                    key={index}
                    onClick={button.onClick}
                    variant={button.variant || 'default'}
                    className="w-full max-w-md"
                  >
                    {buttonContent}
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
