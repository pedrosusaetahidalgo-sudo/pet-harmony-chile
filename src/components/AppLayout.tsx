import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutInner({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      {/* Sidebar - fixed on desktop, offcanvas on mobile */}
      <AppSidebar />

      {/* Main content fills remaining space */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ marginLeft: isMobile ? 0 : undefined }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <LayoutInner>{children}</LayoutInner>
      <CartDrawer />
    </SidebarProvider>
  );
}
