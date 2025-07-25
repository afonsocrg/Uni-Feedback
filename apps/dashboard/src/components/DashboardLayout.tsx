import { SidebarProvider, SidebarTrigger } from '@uni-feedback/ui'
import { Outlet } from 'react-router-dom'
import { DashboardSidebar } from './DashboardSidebar'

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main>
        <SidebarTrigger />
        <Outlet />
      </main>
    </SidebarProvider>
  )
}
