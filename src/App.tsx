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
const PetClinicalRecord = lazy(() => import('./pages/PetClinicalRecord'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const UpgradeSuccess = lazy(() => import('./pages/UpgradeSuccess'));
const UpgradeCancel = lazy(() => import('./pages/UpgradeCancel'));
const Donaciones = lazy(() => import('./pages/Donaciones'));
const Servicios = lazy(() => import('./pages/Servicios'));
// Peluqueria.tsx eliminada — groomers ahora son tab nativo en /services/groomers
const GroomerProfileEdit = lazy(() => import('./pages/GroomerProfileEdit'));
const DirectorioVets = lazy(() => import('./pages/DirectorioVets'));
const PerfilVetPublico = lazy(() => import('./pages/PerfilVetPublico'));
const Demo = lazy(() => import('./pages/Demo'));
const ProviderProfileEdit = lazy(() => import('./pages/ProviderProfileEdit'));
const ProviderPatients = lazy(() => import('./pages/ProviderPatients'));
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
const Reportes = lazy(() => import('./pages/Reportes'));
const ProDashboard = lazy(() => import('./pages/ProDashboard'));
const AnalyticsDashboard = lazy(() => import('./pages/standalone/AnalyticsDashboard'));
const EnMemoria = lazy(() => import('./pages/EnMemoria'));
const BloodDonors = lazy(() => import('./pages/BloodDonors'));
const PetRoutines = lazy(() => import('./pages/PetRoutines'));
// PetTimeline ya no se renderiza como ruta propia: su UI se consolidó
// como tab "Historial" de la ficha clínica en el reordenamiento v3.
// El archivo src/pages/PetTimeline.tsx queda disponible por si se
// necesita restaurar o reutilizar en otro contexto.
const UnifiedCalendar = lazy(() => import('./pages/UnifiedCalendar'));
const RegistroPartner = lazy(() => import('./pages/RegistroPartner'));

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

  // Deep links (OAuth callbacks)
  CapApp.addListener('appUrlOpen', ({ url }) => {
    const slug = url.split('cl.pawfriend.app://').pop();
    if (slug) {
      window.location.href = '/' + slug;
    }
  });

  // Push Notifications
  try {
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive === 'granted') {
      await PushNotifications.register();

      PushNotifications.addListener('registration', (token) => {
        // Token disponible para enviar a backend si se necesita
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
          <ErrorBoundary>
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
                <Route
                  path="/feed"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Feed />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/comunidad"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Community />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/comunidad/:slug"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Community />
                      </AppLayout>
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
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Chat />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:conversationId"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ChatConversation />
                      </AppLayout>
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
                <Route
                  path="/upgrade"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Upgrade />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upgrade/success"
                  element={
                    <ProtectedRoute>
                      <UpgradeSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upgrade/cancel"
                  element={
                    <ProtectedRoute>
                      <UpgradeCancel />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/donaciones"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Donaciones />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/calendar" element={<Navigate to="/mis-reservas" replace />} />
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
                <Route path="/delete-account" element={<DeleteAccount />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </ActiveRoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
