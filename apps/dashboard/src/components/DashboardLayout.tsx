import { useLocalStorage } from '@uidotdev/usehooks'
import { SidebarProvider, SidebarTrigger } from '@uni-feedback/ui'
import { Outlet } from 'react-router-dom'
import { DashboardSidebar } from './DashboardSidebar'
import { Footer } from './Footer'

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useLocalStorage(
    'dashboard_sidebar_open',
    true
  )

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <DashboardSidebar />
      {/* min-w-0: a flex item defaults to min-width:auto, so a fixed-width
          child (a chart's SVG, a nowrap table) would stop this column from
          shrinking when the sidebar opens and push the page sideways. */}
      <div className="w-full min-w-0 flex flex-col min-h-screen">
        <main className="p-4 flex-1">
          <SidebarTrigger className="mb-2" />
          <Outlet />
        </main>
        <Footer />
      </div>
    </SidebarProvider>
  )
}
