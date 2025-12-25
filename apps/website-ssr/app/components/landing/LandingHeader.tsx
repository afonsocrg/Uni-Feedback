import { Button } from '@uni-feedback/ui'
import { useAuth } from '~/hooks/useAuth'
import { useLastVisitedPath } from '~/hooks/useLastVisitedPath'
import { Logo } from './Logo'
import { NavigationDrawer } from './NavigationDrawer'
import { ProfileDrawer } from './ProfileDrawer'
import { ProfilePopover } from './ProfilePopover'

export function LandingHeader() {
  const lastVisitedPath = useLastVisitedPath()
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : '/browse'
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <Logo variant="desktop" />

          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" asChild>
              <a href="/feedback/new">Give Feedback!</a>
            </Button>
            <Button
              size="sm"
              className="shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-primary/90"
              asChild
            >
              <a href={browseLink}>Browse Courses</a>
            </Button>

            <ProfilePopover
              isAuthenticated={isAuthenticated}
              user={user}
              logout={logout}
            />
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between">
          <NavigationDrawer browseLink={browseLink} />
          <Logo variant="mobile" />
          <ProfileDrawer
            isAuthenticated={isAuthenticated}
            user={user}
            logout={logout}
          />
        </div>
      </div>
    </header>
  )
}
