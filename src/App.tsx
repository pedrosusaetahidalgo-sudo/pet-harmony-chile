import { lazy, Suspense, useEffect } from 'react';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { useAuth } from './hooks/useAuth';
import { ReactNode } from 'react';
import { isNative } from '@/lib/platform';

import ProtectedRoute from './components/ProtectedRoute';
import { ActiveRoleProvider } from './hooks/useActiveRole';
import { RoleGuard } from './components/RoleGuard';
import { FeatureGuard } from './components/FeatureGuard';

/** Envuelve la página con AppLayout solo si el user está logueado.
 *  Para rutas públicas (directorio vets, perfiles públicos) que deben verse
 *  como app cuando el user está dentro, y como landing cuando no. */
function PublicWithLayoutIfAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <AppLayout>{children}</AppLayout> : <>{children}</>;
}
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded pages for code splitting
const Index = lazy(() => import('./pages/Index'));
const Home = lazy(() => import('./pages/Home'));
const Feed = lazy(() => import('./pages/Feed'));
const Community = lazy(() => import('./pages/Community'));
const Profile = lazy(() => import('./pages/Profile'));
const Auth = lazy(() => import('./pages/Auth'));
const MyPets = lazy(() => import('./pages/MyPets'));
const AddPet = lazy(() => import('./pages/AddPet'));
const MedicalRecords = lazy(() => import('./pages/MedicalRecords'));
const Adoption = lazy(() => import('./pages/Adoption'));

const PawGame = lazy(() => import('./pages/PawGame'));
const ServiceDirectory = lazy(() => import('./pages/ServiceDirectory'));
// SharedWalks y LostPets eliminados en pivot médico
const Chat = lazy(() => import('./pages/Chat'));
const ChatConversation = lazy(() => import('./pages/ChatConversation'));
const NotFound = lazy(() => import('./pages/NotFound'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
// Checkout eliminado en pivot médico
const PaymentResult = lazy(() => import('./pages/PaymentResult'));
const Admin = lazy(() => import('./pages/Admin'));
// Settings absorbed into Profile — /settings now redirects to /profile
const Maps = lazy(() => import('./pages/Maps'));
// Premium eliminado en pivot médico
const ProviderDashboard = lazy(() => import('./components/provider/ProviderDashboard'));
const ProviderUpgrade = lazy(() => import('./pages/ProviderUpgrade'));
const ProviderSeats = lazy(() => import('./pages/ProviderSeats'));
const AcceptClinicSeat = lazy(() => import('./pages/AcceptClinicSeat'));
const PetClinicalRecord = lazy(() => import('./pages/PetClinicalRecord'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
// Upgrade page removida 2026-04-19: /upgrade redirect a /paw-member.
// Callbacks limpios de Flow (Lote D auditoría pre-launch 2026-04-20, Opción B).
// Las rutas legacy /upgrade/success y /upgrade/cancel redirigen aquí vía 301.
const PawMemberSuccess = lazy(() => import('./pages/PawMemberSuccess'));
const PawMemberCancel = lazy(() => import('./pages/PawMemberCancel'));
const ProviderUpgradeSuccess = lazy(() => import('./pages/ProviderUpgradeSuccess'));
const ProviderUpgradeCancel = lazy(() => import('./pages/ProviderUpgradeCancel'));
const Donaciones = lazy(() => import('./pages/Donaciones'));
const Transparencia = lazy(() => import('./pages/Transparencia'));
const PawCore = lazy(() => import('./pages/PawCore'));
const PawVoicesPage = lazy(() => import('./pages/PawVoices'));
const PawCompanysPage = lazy(() => import('./pages/PawCompanysPage'));
const PawMember = lazy(() => import('./pages/PawMember'));
const Servicios = lazy(() => import('./pages/Servicios'));
// Peluqueria.tsx eliminada — groomers ahora son tab nativo en /services/groomers
const GroomerProfileEdit = lazy(() => import('./pages/GroomerProfileEdit'));
const DirectorioVets = lazy(() => import('./pages/DirectorioVets'));
const PerfilVetPublico = lazy(() => import('./pages/PerfilVetPublico'));
const Demo = lazy(() => import('./pages/Demo'));
const ProviderProfileEdit = lazy(() => import('./pages/ProviderProfileEdit'));
const ProviderPatients = lazy(() => import('./pages/ProviderPatients'));
// CC-25: Booking V3 Fase 4 · vista agenda semanal del provider.
// Gated por FEATURE_FLAGS.PROVIDER_AGENDA_CALENDAR — hoy false.
const ProviderAgenda = lazy(() => import('./pages/ProviderAgenda'));
const RegistroVeterinario = lazy(() => import('./pages/RegistroVeterinario'));
const ParaVeterinarios = lazy(() => import('./pages/ParaVeterinarios'));
const PreciosVeterinarios = lazy(() => import('./pages/PreciosVeterinarios'));
const DejarResena = lazy(() => import('./pages/DejarResena'));
const QRLanding = lazy(() => import('./pages/QRLanding'));
const PawCardLanding = lazy(() => import('./pages/PawCardLanding'));
const PawCollection = lazy(() => import('./pages/PawCollection'));
const Missions = lazy(() => import('./pages/Missions'));
const MedicalShare = lazy(() => import('./pages/MedicalShare'));
// Actividad eliminada — ruta consolidada a /feed
const Reminders = lazy(() => import('./pages/Reminders'));
const OnboardingVetMinimal = lazy(() => import('./pages/OnboardingVetMinimal'));
const OnboardingDuenoMinimal = lazy(() => import('./pages/OnboardingDuenoMinimal'));
const OnboardingShelter = lazy(() => import('./pages/OnboardingShelter'));
const RefugiosHogares = lazy(() => import('./pages/RefugiosHogares'));
const RefugioPublico = lazy(() => import('./pages/RefugioPublico'));
const MemoriaPublica = lazy(() => import('./pages/MemoriaPublica'));
const Aplicar = lazy(() => import('./pages/Aplicar'));
const NosePrintTest = lazy(() => import('./pages/NosePrintTest'));
const NoseScan = lazy(() => import('./pages/NoseScan'));
const PawPartners = lazy(() => import('./pages/PawPartners'));
const PostAdoptionCheckin = lazy(() => import('./pages/PostAdoptionCheckin'));
const ShelterDashboard = lazy(() => import('./pages/shelter/ShelterDashboard'));
const ShelterPets = lazy(() => import('./pages/shelter/ShelterPets'));
const ShelterAdoptionsKanban = lazy(() => import('./pages/shelter/ShelterAdoptionsKanban'));
const MisAdopciones = lazy(() => import('./pages/MisAdopciones'));
const ShelterBulkImport = lazy(() => import('./pages/shelter/ShelterBulkImport'));
const ShelterProfile = lazy(() => import('./pages/shelter/ShelterProfile'));
const ShelterTransferPet = lazy(() => import('./pages/shelter/ShelterTransferPet'));
const Reportes = lazy(() => import('./pages/Reportes'));
const ProDashboard = lazy(() => import('./pages/ProDashboard'));
const AnalyticsDashboard = lazy(() => import('./pages/standalone/AnalyticsDashboard'));
const EnMemoria = lazy(() => import('./pages/EnMemoria'));
const BloodDonors = lazy(() => import('./pages/BloodDonors'));
const PetRoutines = lazy(() => import('./pages/PetRoutines'));
// PetTimeline: eliminado 2026-04-19. Su UI vive como tab "Historial" de
// la ficha clinica, y TabHistorial ahora absorbio las 4 fuentes que
// PetTimeline unificaba: pet_reminders completados, pet_activities,
// routine_completions y memorial_events. El redirect legacy
// LegacyPetTimelineRedirect apunta a /ficha/:petId?tab=historial.
const UnifiedCalendar = lazy(() => import('./pages/UnifiedCalendar'));
const RegistroPartner = lazy(() => import('./pages/RegistroPartner'));
const FAQ = lazy(() => import('./pages/FAQ'));
const BlogIndex = lazy(() => import('./pages/BlogIndex'));
const BlogPost = lazy(() => import('./pages/BlogPost'));

/** Inicialización nativa: StatusBar, SplashScreen, back button, push notifications */
async function initNative() {
  if (!isNative()) return;

  const [{ StatusBar, Style }, { SplashScreen }, { App: CapApp }, { PushNotifications }] =
    await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
      import('@capacitor/app'),
      import('@capacitor/push-notifications'),
    ]);

  // StatusBar
  StatusBar.setBackgroundColor({ color: '#8B5CF6' });
  StatusBar.setStyle({ style: Style.Dark });

  // SplashScreen
  SplashScreen.hide();

  // Back button (Android)
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      CapApp.exitApp();
    }
  });

  // Deep links — maneja custom scheme (OAuth callbacks) y Universal
  // Links / App Links (épica D.3 auditoría top-tier 2026-04-20).
  CapApp.addListener('appUrlOpen', ({ url }) => {
    // Custom scheme: cl.pawfriend.app://qr/abc → '/qr/abc'
    if (url.startsWith('cl.pawfriend.app://')) {
      const slug = url.split('cl.pawfriend.app://').pop();
      if (slug) window.location.href = '/' + slug;
      return;
    }
    // Universal Link iOS / App Link Android: https://pawfriend.cl/qr/abc
    const PROD_ORIGIN = 'https://pawfriend.cl';
    if (url.startsWith(PROD_ORIGIN)) {
      const path = url.slice(PROD_ORIGIN.length) || '/';
      window.location.href = path;
    }
  });

  // Push Notifications
  try {
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive === 'granted') {
      await PushNotifications.register();

      // INIT-16: persistir token en device_tokens para que backend pueda
      // disparar push a este dispositivo.
      PushNotifications.addListener('registration', async (token) => {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { Capacitor } = await import('@capacitor/core');
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;
          const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
          await supabase.from('device_tokens').upsert(
            {
              user_id: user.id,
              platform,
              token: token.value,
              enabled: true,
            },
            { onConflict: 'user_id,token' }
          );
        } catch {
          // Best effort — no bloqueamos la app si el upsert falla
        }
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        // Toast se maneja via sonner — import dinámico para no añadir al bundle sync
        import('sonner').then(({ toast }) => {
          toast.info(notification.title || 'Nueva notificación');
        });
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const route = action.notification.data?.route;
        if (route) window.location.href = route;
      });
    }
  } catch {
    // Push not available (e.g. simulator)
  }
}

// Fire-and-forget native init
initNative();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Preload rutas críticas en idle time (mejora UX mobile)
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => {
    import('./pages/Home');
    import('./pages/MyPets');
    import('./pages/MedicalRecords');
  });
}

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
);

/** Redirect legacy /pet/:petId/clinical y /mascota/:petId/ficha-clinica → /ficha/:petId */
const LegacyClinicalRedirect = () => {
  const { petId } = useParams<{ petId: string }>();
  const { search } = useLocation();
  return <Navigate to={`/ficha/${petId}${search}`} replace />;
};

/** ErrorBoundary con scope por ruta: al cambiar pathname el boundary se
 *  remonta (gracias a la key) y se resetea el estado de error, así el
 *  usuario puede navegar para recuperarse sin hacer reload. */
function RouteScopedErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}

/** /mascota/:petId/timeline → /ficha/:petId?tab=historial (Timeline vive como
 *  tab Historial en la ficha clinica desde el reordenamiento v3). */
const LegacyPetTimelineRedirect = () => {
  const { petId } = useParams<{ petId: string }>();
  return <Navigate to={`/ficha/${petId}?tab=historial`} replace />;
};

/** /mascota/:petId/rutinas → /calendario?tab=rutinas&pet=:petId (rutinas
 *  viven como tab en el calendario unificado desde v3). */
const LegacyPetRoutinesRedirect = () => {
  const { petId } = useParams<{ petId: string }>();
  return <Navigate to={`/calendario?tab=rutinas&pet=${petId}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <CookieConsentBanner />
      <BrowserRouter>
        <ActiveRoleProvider>
          <RouteScopedErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Home />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                {/* Social: /feed, /comunidad, /comunidad/:slug — rutas con */}
                {/* feature flags (FEED, LABS_COMMUNITY). Si la flag esta */}
                {/* en false (ver src/lib/featureFlags.ts), redirigen a /home. */}
                <Route
                  path="/feed"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard flag="FEED">
                        <AppLayout>
                          <Feed />
                        </AppLayout>
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/comunidad"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard flag="LABS_COMMUNITY">
                        <AppLayout>
                          <Community />
                        </AppLayout>
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/comunidad/:slug"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard flag="LABS_COMMUNITY">
                        <AppLayout>
                          <Community />
                        </AppLayout>
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-pets"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <MyPets />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/paw-collection"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="owner" fallback="/provider/dashboard">
                        <AppLayout>
                          <PawCollection />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/misiones"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="owner" fallback="/provider/dashboard">
                        <AppLayout>
                          <Missions />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-pet"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AddPet />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-pet/:petId"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AddPet />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medical-records"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <MedicalRecords />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reminders"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Reminders />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rutinas"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <PetRoutines />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                {/* Duplicados detectados 2026-04-17: la info vive en ficha
                    (tab Historial) y en calendario (?tab=rutinas). Redirect
                    para consolidar sin romper deep links existentes. */}
                <Route path="/mascota/:petId/rutinas" element={<LegacyPetRoutinesRedirect />} />
                <Route path="/mascota/:petId/timeline" element={<LegacyPetTimelineRedirect />} />
                <Route
                  path="/calendario"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <UnifiedCalendar />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/adoption"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Adoption />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Onboarding refugios / hogares de adopcion */}
                <Route
                  path="/onboarding-shelter"
                  element={
                    <ProtectedRoute>
                      <OnboardingShelter />
                    </ProtectedRoute>
                  }
                />

                {/* Area privada del refugio. RoleGuard fuerza shelter role +
                    redirige si el user no tiene cuenta de refugio. */}
                <Route
                  path="/shelter/dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="shelter" fallback="/onboarding-shelter">
                        <AppLayout>
                          <ShelterDashboard />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shelter/pets"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="shelter" fallback="/onboarding-shelter">
                        <AppLayout>
                          <ShelterPets />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shelter/bulk-import"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="shelter" fallback="/onboarding-shelter">
                        <AppLayout>
                          <ShelterBulkImport />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shelter/profile"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="shelter" fallback="/onboarding-shelter">
                        <AppLayout>
                          <ShelterProfile />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shelter/transfer/:petId"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="shelter" fallback="/onboarding-shelter">
                        <AppLayout>
                          <ShelterTransferPet />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Refactor adopcion 2026-04-24 (Bloque 2): Kanban de procesos para refugios */}
                <Route
                  path="/shelter/adopciones"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="shelter" fallback="/onboarding-shelter">
                        <AppLayout>
                          <ShelterAdoptionsKanban />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Refactor adopcion 2026-04-24 (Bloque 2): Timeline de procesos para adopters */}
                <Route
                  path="/mis-adopciones"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <MisAdopciones />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/paw-game"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="owner" fallback="/provider/dashboard">
                        <AppLayout>
                          <PawGame />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/servicios"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Servicios />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/peluquero/perfil"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <GroomerProfileEdit />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                {/* /services/vets era ruta fantasma (caia en ServiceDirectory
                    por el :type), pero el directorio canonico de vets es
                    /veterinarios (publico). Redirect antes de /services/:type. */}
                <Route path="/services/vets" element={<Navigate to="/veterinarios" replace />} />
                <Route
                  path="/services/:type"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ServiceDirectory />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                {/* /shared-walks y /lost-pets eliminados en pivot médico */}
                <Route
                  path="/maps"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Maps />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                {/* Chat: feature flag CHAT (hoy false en featureFlags.ts). */}
                {/* Si se reactiva, quitar FeatureGuard o ajustar flag. */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard flag="CHAT">
                        <AppLayout>
                          <Chat />
                        </AppLayout>
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:conversationId"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard flag="CHAT">
                        <AppLayout>
                          <ChatConversation />
                        </AppLayout>
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Profile />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user/:userId"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <UserProfile />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                {/* /checkout eliminado en pivot médico */}
                {/* Pagos: una sola ruta unificada con query param ?status=success|failed */}
                <Route
                  path="/payment-result"
                  element={
                    <ProtectedRoute>
                      <PaymentResult />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AppLayout>
                        <Admin />
                      </AppLayout>
                    </AdminRoute>
                  }
                />
                <Route path="/settings" element={<Navigate to="/profile" replace />} />
                <Route
                  path="/en-memoria"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <EnMemoria />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/donantes-sangre"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <BloodDonors />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="provider">
                        <AppLayout>
                          <ProviderDashboard />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/upgrade"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="provider">
                        <AppLayout>
                          <ProviderUpgrade />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/seats"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="provider">
                        <AppLayout>
                          <ProviderSeats />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/accept-seat"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AcceptClinicSeat />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/pacientes"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="provider">
                        <AppLayout>
                          <ProviderPatients />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                {/* CC-25: /provider/agenda · Booking V3 Fase 4.
                    Gated con FeatureGuard PROVIDER_AGENDA_CALENDAR.
                    Cuando esté off, redirige al dashboard. */}
                <Route
                  path="/provider/agenda"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="provider">
                        <FeatureGuard flag="PROVIDER_AGENDA_CALENDAR">
                          <AppLayout>
                            <ProviderAgenda />
                          </AppLayout>
                        </FeatureGuard>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/profile-edit"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="provider">
                        <AppLayout>
                          <ProviderProfileEdit />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ficha/:petId"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <PetClinicalRecord />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                {/* Redirects legacy para links ya compartidos / QR impresos */}
                <Route path="/mascota/:petId/ficha-clinica" element={<LegacyClinicalRedirect />} />
                <Route path="/pet/:petId/clinical" element={<LegacyClinicalRedirect />} />
                <Route
                  path="/mis-reservas"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <MyBookings />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                {/* /upgrade/* legacy (2026-04-19 pivot + Lote D 2026-04-20).
                    Redirects a las rutas limpias /paw-member/* Opción B elegida.
                    Si Flow sigue redirigiendo a URLs antiguas, el 301 mantiene el flujo
                    sin pérdida. */}
                <Route path="/upgrade" element={<Navigate to="/paw-member" replace />} />
                <Route
                  path="/upgrade/success"
                  element={<Navigate to="/paw-member/success" replace />}
                />
                <Route
                  path="/upgrade/cancel"
                  element={<Navigate to="/paw-member/cancel" replace />}
                />
                <Route
                  path="/paw-member/success"
                  element={
                    <ProtectedRoute>
                      <PawMemberSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/paw-member/cancel"
                  element={
                    <ProtectedRoute>
                      <PawMemberCancel />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/upgrade/success"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="provider">
                        <AppLayout>
                          <ProviderUpgradeSuccess />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/upgrade/cancel"
                  element={
                    <ProtectedRoute>
                      <RoleGuard requiredRole="provider">
                        <AppLayout>
                          <ProviderUpgradeCancel />
                        </AppLayout>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                {/* /donaciones — página pública. Donaciones.tsx ya redirige a /auth
                    si el user anónimo hace click en donar. El resto (muralla,
                    transparencia, Paw Companys grid) se lee sin login. */}
                <Route
                  path="/donaciones"
                  element={
                    <PublicWithLayoutIfAuth>
                      <Donaciones />
                    </PublicWithLayoutIfAuth>
                  }
                />
                {/* /transparencia — página pública con desglose costos + metas
                    en vivo + muralla donaciones públicas + Paw Companys grid. */}
                <Route
                  path="/transparencia"
                  element={
                    <PublicWithLayoutIfAuth>
                      <Transparencia />
                    </PublicWithLayoutIfAuth>
                  }
                />
                {/* /paw-core — página pública estratégica. Contenido 100% estático
                    (misión, visión, valores, modelo). No requiere user data. */}
                <Route
                  path="/paw-core"
                  element={
                    <PublicWithLayoutIfAuth>
                      <PawCore />
                    </PublicWithLayoutIfAuth>
                  }
                />
                <Route
                  path="/paw-member"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <PawMember />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                {/* 2026-04-21: antes redirigia a /mis-reservas (confuso), */}
                {/* ahora al calendario unificado que es la superficie temporal default. */}
                <Route path="/calendar" element={<Navigate to="/calendario?tab=hoy" replace />} />
                {/* Paw Voices — pagina publica (creadores/influencers) */}
                <Route
                  path="/paw-voices"
                  element={
                    <PublicWithLayoutIfAuth>
                      <PawVoicesPage />
                    </PublicWithLayoutIfAuth>
                  }
                />
                {/* Paw Companys — pagina publica (empresas aliadas) */}
                <Route
                  path="/paw-companys"
                  element={
                    <PublicWithLayoutIfAuth>
                      <PawCompanysPage />
                    </PublicWithLayoutIfAuth>
                  }
                />
                {/* Directorio público de veterinarios (sin login).
                  Si el user está logueado, lo envolvemos con AppLayout para
                  mantener header/sidebar consistente con el resto de la app. */}
                <Route
                  path="/veterinarios"
                  element={
                    <PublicWithLayoutIfAuth>
                      <DirectorioVets />
                    </PublicWithLayoutIfAuth>
                  }
                />
                <Route
                  path="/veterinarios/comuna/:comuna"
                  element={
                    <PublicWithLayoutIfAuth>
                      <DirectorioVets />
                    </PublicWithLayoutIfAuth>
                  }
                />
                <Route
                  path="/veterinarios/especialidad/:especialidad"
                  element={
                    <PublicWithLayoutIfAuth>
                      <DirectorioVets />
                    </PublicWithLayoutIfAuth>
                  }
                />
                <Route
                  path="/veterinarios/:slug"
                  element={
                    <PublicWithLayoutIfAuth>
                      <PerfilVetPublico />
                    </PublicWithLayoutIfAuth>
                  }
                />

                {/* Directorio publico de refugios / hogares de adopcion (SEO).
                    Accesible con o sin login. Si esta logueado, AppLayout. */}
                <Route
                  path="/refugios-hogares"
                  element={
                    <PublicWithLayoutIfAuth>
                      <RefugiosHogares />
                    </PublicWithLayoutIfAuth>
                  }
                />
                <Route
                  path="/refugios/:slug"
                  element={
                    <PublicWithLayoutIfAuth>
                      <RefugioPublico />
                    </PublicWithLayoutIfAuth>
                  }
                />

                {/* Memorial viral (Refactor Maestro §6.7): pagina publica
                    compartible para mascotas fallecidas con memorial_visibility='public'.
                    OG meta tags para preview en WhatsApp/Instagram/Twitter. */}
                <Route
                  path="/memoria/:petId"
                  element={
                    <PublicWithLayoutIfAuth>
                      <MemoriaPublica />
                    </PublicWithLayoutIfAuth>
                  }
                />

                {/* Directorio publico de Paw Partners (tiendas/servicios aliados) */}
                <Route
                  path="/paw-partners"
                  element={
                    <PublicWithLayoutIfAuth>
                      <PawPartners />
                    </PublicWithLayoutIfAuth>
                  }
                />

                {/* Formulario publico de postulacion (pitch decks → /aplicar?tipo=...) */}
                <Route
                  path="/aplicar"
                  element={
                    <PublicWithLayoutIfAuth>
                      <Aplicar />
                    </PublicWithLayoutIfAuth>
                  }
                />

                {/* Pagina publica de crowdsourcing nose print (Refactor Maestro 2026-04-24) */}
                {/* Standalone sin layout para captura full-screen. */}
                <Route path="/nose-print-test" element={<NosePrintTest />} />

                {/* Refactor Maestro Fase 1 §6.2 — Pagina publica para identificar
                    mascotas perdidas via huella nasal. Sin auth (verify_jwt=false
                    en la edge fn nose-print-match). */}
                <Route path="/nose-scan" element={<NoseScan />} />

                {/* Check-in post-adopcion (link desde email del cron) */}
                <Route
                  path="/post-adoption/:id"
                  element={
                    <ProtectedRoute>
                      <PostAdoptionCheckin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/demo"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <Demo />
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                {/* Onboarding minimal: flows post-registro fullscreen (sin */}
                {/* AppLayout intencionalmente). Ruta huerfana en sidebar */}
                {/* porque son deeplinks desde el signup o email de bienvenida. */}
                {/* Los componentes OnboardingDuenoMinimal/OnboardingVetMinimal */}
                {/* estan listos para reactivar cuando se defina el flow formal. */}
                <Route
                  path="/onboarding-mascota"
                  element={
                    <ProtectedRoute>
                      <OnboardingDuenoMinimal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/onboarding-vet"
                  element={
                    <ProtectedRoute>
                      <OnboardingVetMinimal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Reportes />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/panel-pro"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ProDashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics-demo"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AppLayout>
                          <AnalyticsDashboard />
                        </AppLayout>
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route path="/registro-veterinario" element={<RegistroVeterinario />} />
                <Route path="/registro-proveedor" element={<RegistroVeterinario />} />
                <Route path="/registro-partner" element={<RegistroPartner />} />
                <Route path="/para-veterinarios" element={<ParaVeterinarios />} />
                <Route
                  path="/precios-veterinarios"
                  element={
                    <PublicWithLayoutIfAuth>
                      <PreciosVeterinarios />
                    </PublicWithLayoutIfAuth>
                  }
                />
                <Route
                  path="/precios-veterinarios/comuna/:comuna"
                  element={
                    <PublicWithLayoutIfAuth>
                      <PreciosVeterinarios />
                    </PublicWithLayoutIfAuth>
                  }
                />
                <Route path="/resena/:token" element={<DejarResena />} />
                <Route path="/qr/:token" element={<QRLanding />} />
                <Route path="/paw-card/:pawCardId" element={<PawCardLanding />} />
                <Route path="/medical-share/:token" element={<MedicalShare />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/blog" element={<BlogIndex />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/delete-account" element={<DeleteAccount />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RouteScopedErrorBoundary>
        </ActiveRoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
