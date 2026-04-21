import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { BottomTabBar } from '@/components/BottomTabBar';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { useIsMobile } from '@/hooks/use-mobile';
import { useErrorReporter } from '@/hooks/useErrorReporter';
import { useAnalyticsTracker } from '@/hooks/useAnalyticsTracker';
import { useAppTrackingTransparency } from '@/hooks/useAppTrackingTransparency';

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutInner({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const isAdmin = pathname === '/admin';
  useErrorReporter(); // Global error capture to error_logs
  useAnalyticsTracker(); // Page views, dwell time, sessions
  useAppTrackingTransparency(); // iOS ATT prompt (no-op en web/Android) — D.6 auditoría top-tier

  if (isAdmin) {
    // flex-1 + w-full: el SidebarProvider padre es flex, sin esto el admin
    // queda angosto y aparece una barra vacia a la derecha.
    return (
      <div className="min-h-screen w-full flex-1 bg-background overflow-x-hidden">{children}</div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      {/* Skip link (WCAG 2.4.1) — invisible hasta que recibe foco por teclado.
          Permite a usuarios de lector de pantalla saltar Header + Sidebar. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Saltar al contenido principal
      </a>

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
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto animate-fade-in focus:outline-none"
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

      {/* Feedback widget — floating button + modal.
          Antes estaba oculto en /home, pero ahi es justo donde mas usuarios
          buscan dar feedback o donar. Se muestra en todas las rutas auth. */}
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
