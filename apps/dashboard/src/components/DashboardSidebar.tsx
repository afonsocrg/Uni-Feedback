import { Link, useLocation } from 'react-router-dom'
import {
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  MessageSquare,
  Settings,
  Home
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@uni-feedback/ui'
import { useAuth } from '@providers'

const menuItems = [
  { title: 'Dashboard', icon: Home, url: '/' },
  { title: 'Users', icon: Users, url: '/users', requiresSuperuser: true },
  { title: 'Faculties', icon: Building2, url: '/faculties' },
  { title: 'Degrees', icon: GraduationCap, url: '/degrees' },
  { title: 'Courses', icon: BookOpen, url: '/courses' },
  { title: 'Feedback', icon: MessageSquare, url: '/feedback' }
]

export function DashboardSidebar() {
  const location = useLocation()
  const { user } = useAuth()

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.requiresSuperuser) {
      return user?.superuser
    }
    return true
  })

  return (
    <Sidebar className="bg-gradient-to-b from-primaryBlue to-primaryBlue/90 text-white border-r-0">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-2 px-2 py-4 border-b border-white/20">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-white">Admin Dashboard</span>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                const isActive = location.pathname === item.url
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={
                        isActive
                          ? 'bg-white/20 text-white border-l-2 border-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto">
          <SidebarGroup>
            <div className="border-t border-white/20 pt-4">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === '/profile'}
                      className={
                        location.pathname === '/profile'
                          ? 'bg-white/20 text-white border-l-2 border-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }
                    >
                      <Link to="/profile" className="flex items-center gap-3">
                        <Settings className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </div>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
