import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 max-w-full">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto animate-fade-in">
            {children}
          </main>
        </div>
      </div>
      <CartDrawer />
    </SidebarProvider>
  );
}
