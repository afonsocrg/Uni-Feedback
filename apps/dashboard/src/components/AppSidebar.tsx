// import { useAuth } from '@providers'
// import {
//   Sidebar,
//   SidebarContent,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem
// } from '@uni-feedback/ui'
// import {
//   BookOpen,
//   Building2,
//   GraduationCap,
//   Home,
//   MessageSquare,
//   Settings,
//   Users
// } from 'lucide-react'
// import { Link, useLocation } from 'react-router-dom'

// const navigationItems = [
//   {
//     title: 'Platform',
//     items: [
//       { title: 'Dashboard', icon: Home, url: '/' },
//       { title: 'Users', icon: Users, url: '/users', requiresSuperuser: true },
//       { title: 'Feedback', icon: MessageSquare, url: '/feedback' }
//     ]
//   },
//   {
//     title: 'Content',
//     items: [
//       { title: 'Faculties', icon: Building2, url: '/faculties' },
//       { title: 'Degrees', icon: GraduationCap, url: '/degrees' },
//       { title: 'Courses', icon: BookOpen, url: '/courses' }
//     ]
//   }
// ]

// export function AppSidebar() {
//   const location = useLocation()
//   const { user } = useAuth()

//   return (
//     <Sidebar>
//       <SidebarContent>
//         {/* <SidebarGroup>
//           <div className="flex items-center gap-2 px-2 py-4">
//             <div className="p-1.5 bg-primary/10 rounded-lg">
//               <GraduationCap className="h-5 w-5 text-primary" />
//             </div>
//             <span className="font-semibold">Admin Dashboard</span>
//           </div>
//         </SidebarGroup> */}

//         {navigationItems.map((section) => (
//           <SidebarGroup key={section.title}>
//             <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
//             <SidebarGroupContent>
//               <SidebarMenu>
//                 {section.items
//                   .filter((item) => {
//                     if (item.requiresSuperuser) {
//                       return user?.superuser
//                     }
//                     return true
//                   })
//                   .map((item) => {
//                     const isActive = location.pathname === item.url
//                     return (
//                       <SidebarMenuItem key={item.url}>
//                         <SidebarMenuButton asChild isActive={isActive}>
//                           <Link to={item.url}>
//                             <item.icon />
//                             <span>{item.title}</span>
//                           </Link>
//                         </SidebarMenuButton>
//                       </SidebarMenuItem>
//                     )
//                   })}
//               </SidebarMenu>
//             </SidebarGroupContent>
//           </SidebarGroup>
//         ))}

//         <div className="mt-auto">
//           <SidebarGroup>
//             <SidebarGroupContent>
//               <SidebarMenu>
//                 <SidebarMenuItem>
//                   <SidebarMenuButton
//                     asChild
//                     isActive={location.pathname === '/profile'}
//                   >
//                     <Link to="/profile">
//                       <Settings />
//                       <span>Profile</span>
//                     </Link>
//                   </SidebarMenuButton>
//                 </SidebarMenuItem>
//               </SidebarMenu>
//             </SidebarGroupContent>
//           </SidebarGroup>
//         </div>
//       </SidebarContent>
//     </Sidebar>
//   )
// }

import { Calendar, Home, Inbox, Search, Settings } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@uni-feedback/ui'

// Menu items.
const items = [
  {
    title: 'Home',
    url: '#',
    icon: Home
  },
  {
    title: 'Inbox',
    url: '#',
    icon: Inbox
  },
  {
    title: 'Calendar',
    url: '#',
    icon: Calendar
  },
  {
    title: 'Search',
    url: '#',
    icon: Search
  },
  {
    title: 'Settings',
    url: '#',
    icon: Settings
  }
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
    </Sidebar>
  )
}
