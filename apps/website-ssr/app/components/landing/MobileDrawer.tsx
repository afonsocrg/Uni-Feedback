import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger
} from '@uni-feedback/ui'
import { LogOut, Menu, User } from 'lucide-react'
import { analytics, getPageName } from '~/utils/analytics'

interface MobileDrawerProps {
  browseLink: string
  isAuthenticated: boolean
  user?: {
    username: string
    email: string
  } | null
  logout: () => void
}

export function MobileDrawer({
  browseLink,
  isAuthenticated,
  user,
  logout
}: MobileDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" className="size-9 p-0">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 pb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <Separator />

          {/* Main Navigation */}
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
                  href="/feedback/new?from=nav_drawer"
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

          {/* Profile Section at Bottom */}
          <div className="p-4 pt-0 mt-auto">
            <Separator className="mb-4" />
            {isAuthenticated ? (
              <div className="space-y-3">
                {/* User Info */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Profile Link */}
                <Button
                  variant="ghost"
                  className="w-full justify-start h-11 text-base px-4"
                  asChild
                >
                  <a href="/profile">
                    <User className="size-5 mr-3" />
                    Profile
                  </a>
                </Button>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  className="w-full justify-start h-11 text-base px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={logout}
                >
                  <LogOut className="size-5 mr-3" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground px-4">
                  Sign in to access your profile
                </p>
                <Button className="w-full h-11" asChild>
                  <a href="/login">Sign in</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
