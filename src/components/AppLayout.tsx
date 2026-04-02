import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { PremiumBanner } from "@/components/PremiumBanner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutInner({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: premiumProfile } = useQuery({
    queryKey: ["user-premium-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  const isPremium = !!premiumProfile?.is_premium;

  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      {/* Sidebar - fixed on desktop, offcanvas on mobile */}
      <AppSidebar />

      {/* Main content fills remaining space */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ marginLeft: isMobile ? 0 : undefined }}
      >
        {!isPremium && <PremiumBanner />}
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
