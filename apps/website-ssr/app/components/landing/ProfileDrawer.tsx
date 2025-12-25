import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger
} from '@uni-feedback/ui'
import { LogOut, User } from 'lucide-react'

interface ProfileDrawerProps {
  isAuthenticated: boolean
  user?: {
    username: string
    email: string
  } | null
  logout: () => void
}

export function ProfileDrawer({
  isAuthenticated,
  user,
  logout
}: ProfileDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" className="size-9 p-0">
          <User className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
        {isAuthenticated ? (
          <div className="flex flex-col h-full">
            {/* User Info Header */}
            <div className="bg-muted/50 p-6 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="size-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold truncate">
                    {user?.username}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
            <Separator />

            {/* Navigation Links */}
            <nav className="flex-1 p-4">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-base px-4"
                  asChild
                >
                  <a href="/profile">
                    <User className="size-5 mr-3" />
                    Profile
                  </a>
                </Button>
              </div>
            </nav>

            {/* Logout at bottom */}
            <div className="p-4 pt-0">
              <Separator className="mb-4" />
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={logout}
              >
                <LogOut className="size-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-2">Welcome</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Sign in to Uni Feedback.
              </p>
              <Button className="w-full h-11" asChild>
                <a href="/login">Sign in</a>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
