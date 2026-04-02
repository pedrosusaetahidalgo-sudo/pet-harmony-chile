import { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: AppLayoutProps) {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <div className="min-h-screen flex w-full bg-background overflow-hidden">
      <AppSidebar />
      <div
        className="flex-1 flex flex-col min-w-0 max-w-full transition-all duration-200"
        style={{ marginLeft: isCollapsed ? '64px' : undefined }}
      >
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutContent>{children}</LayoutContent>
      <CartDrawer />
    </SidebarProvider>
  );
}
