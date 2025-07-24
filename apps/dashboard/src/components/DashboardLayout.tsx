// import { SidebarProvider } from '@uni-feedback/ui'
import { Outlet } from 'react-router-dom'
import { DashboardHeader } from './DashboardHeader'
import { DashboardSidebar } from './DashboardSidebar'

export function DashboardLayout() {
  return (
    // <SidebarProvider>
    <div className="flex h-screen bg-background">
      <DashboardSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    // </SidebarProvider>
  )
}
