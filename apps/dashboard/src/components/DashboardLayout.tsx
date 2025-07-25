import { SidebarProvider, SidebarTrigger } from '@uni-feedback/ui'
import { DashboardSidebar } from './DashboardSidebar'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
