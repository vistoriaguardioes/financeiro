
import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultCollapsed={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="guardioes-container guardioes-section">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
