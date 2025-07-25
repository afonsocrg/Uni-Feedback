import { SidebarProvider, SidebarTrigger } from '@uni-feedback/ui'
import { AppSidebar } from './AppSidebar'

export function DashboardLayout() {
  return (
    // <SidebarProvider>
    //   <AppSidebar />
    //   <SidebarInset>
    //     <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
    //       <SidebarTrigger className="-ml-1" />
    //       <Separator orientation="vertical" className="mr-2 h-4" />
    //       <div className="flex items-center gap-2">
    //         <h1 className="text-lg font-semibold">Admin Dashboard</h1>
    //       </div>
    //     </header>
    //     <main className="flex-1 p-8">
    //       <div className="mx-auto max-w-7xl">
    //         <Outlet />
    //       </div>
    //     </main>
    //   </SidebarInset>
    // </SidebarProvider>
    // <SidebarProvider>
    //   <AppSidebar />
    //   <main>
    //     <div className="s-100 rounded-full bg-red-200" />

    //     <SidebarTrigger />
    //     <h1>Hello!</h1>
    //   </main>
    // </SidebarProvider>
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        <h1>Test</h1>
      </main>
    </SidebarProvider>
  )
}
