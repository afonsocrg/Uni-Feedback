import { useAuth } from '@hooks'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@uni-feedback/ui'
import {
  BookOpen,
  Building2,
  GraduationCap,
  MessageSquare,
  Users
} from 'lucide-react'
import { NavUser } from './NavUser'

// Menu items.
const items = [
  {
    title: 'Users',
    url: '/users',
    icon: Users,
    superuserOnly: true
  },
  {
    title: 'Faculties',
    url: '/faculties',
    icon: Building2
  },
  {
    title: 'Degrees',
    url: '/degrees',
    icon: GraduationCap
  },
  {
    title: 'Courses',
    url: '/courses',
    icon: BookOpen
  },
  {
    title: 'Feedback',
    url: '/feedback',
    icon: MessageSquare
  }
]

export function DashboardSidebar() {
  const { user } = useAuth()
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Uni Feedback</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items
                .filter((item) => !item.superuserOnly || user?.superuser)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
