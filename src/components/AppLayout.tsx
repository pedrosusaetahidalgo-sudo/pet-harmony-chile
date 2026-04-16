import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { BottomTabBar } from '@/components/BottomTabBar';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { useIsMobile } from '@/hooks/use-mobile';
import { useErrorReporter } from '@/hooks/useErrorReporter';
import { useAnalyticsTracker } from '@/hooks/useAnalyticsTracker';

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutInner({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  useErrorReporter(); // Global error capture to error_logs
  useAnalyticsTracker(); // Page views, dwell time, sessions

  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      {/* Sidebar - fixed on desktop, offcanvas (oculto) on mobile.
          En mobile, la navegación principal es BottomTabBar. */}
      <AppSidebar />

      {/* Main content fills remaining space */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ marginLeft: isMobile ? 0 : undefined }}
      >
        <Header />
        <main
          className="flex-1 overflow-y-auto animate-fade-in"
          style={{
            // Bottom padding: safe area + altura de la BottomTabBar (56px) en mobile
            paddingBottom: isMobile
              ? 'calc(var(--safe-area-bottom) + 3.5rem)'
              : 'var(--safe-area-bottom)',
          }}
        >
          {children}
        </main>
      </div>

      {/* Bottom tab bar — solo mobile */}
      <BottomTabBar />

      {/* Feedback widget — floating button + modal */}
      <FeedbackWidget />
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
