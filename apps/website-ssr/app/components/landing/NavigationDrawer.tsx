import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger
} from '@uni-feedback/ui'
import { Menu } from 'lucide-react'
import { analytics, getPageName } from '~/utils/analytics'

interface NavigationDrawerProps {
  browseLink: string
}

export function NavigationDrawer({ browseLink }: NavigationDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" className="size-9 p-0">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <div className="flex flex-col h-full">
          <div className="p-6 pb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <Separator />
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base px-4"
                asChild
              >
                <a href={browseLink}>Browse Courses</a>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base px-4"
                asChild
              >
                <a
                  href="/feedback/new"
                  onClick={() => {
                    analytics.navigation.feedbackFormLinkClicked({
                      source: 'mobile_menu',
                      referrerPage: getPageName(window.location.pathname)
                    })
                  }}
                >
                  Give Feedback
                </a>
              </Button>
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
