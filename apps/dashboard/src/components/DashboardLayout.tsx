import { SidebarProvider, SidebarTrigger } from '@uni-feedback/ui'
import { Outlet } from 'react-router-dom'
import { DashboardSidebar } from './DashboardSidebar'
import { Footer } from './Footer'

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <div className="w-full flex flex-col min-h-screen">
        <main className="p-4 flex-1">
          <SidebarTrigger className="mb-2" />
          <Outlet />
        </main>
        <Footer />
      </div>
    </SidebarProvider>
  )
}
