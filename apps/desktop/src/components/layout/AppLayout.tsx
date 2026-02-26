import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto h-full w-full max-w-6xl rounded-2xl bg-card shadow-sm border border-border">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
