import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { useAuth } from "./hooks/useAuth";
import { ReactNode } from "react";

import ProtectedRoute from "./components/ProtectedRoute";

/** Envuelve la página con AppLayout solo si el user está logueado.
 *  Para rutas públicas (directorio vets, perfiles públicos) que deben verse
 *  como app cuando el user está dentro, y como landing cuando no. */
function PublicWithLayoutIfAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <AppLayout>{children}</AppLayout> : <>{children}</>;
}
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy-loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Feed = lazy(() => import("./pages/Feed"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const MyPets = lazy(() => import("./pages/MyPets"));
const AddPet = lazy(() => import("./pages/AddPet"));
const MedicalRecords = lazy(() => import("./pages/MedicalRecords"));
const Adoption = lazy(() => import("./pages/Adoption"));

const PawGame = lazy(() => import("./pages/PawGame"));
const ServiceDirectory = lazy(() => import("./pages/ServiceDirectory"));
// SharedWalks y LostPets eliminados en pivot médico
const Chat = lazy(() => import("./pages/Chat"));
const ChatConversation = lazy(() => import("./pages/ChatConversation"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
// Checkout eliminado en pivot médico
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const Maps = lazy(() => import("./pages/Maps"));
// Premium eliminado en pivot médico
const ProviderDashboard = lazy(() => import("./components/provider/ProviderDashboard"));
const PetClinicalRecord = lazy(() => import("./pages/PetClinicalRecord"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const UpgradeSuccess = lazy(() => import("./pages/UpgradeSuccess"));
const UpgradeCancel = lazy(() => import("./pages/UpgradeCancel"));
const Servicios = lazy(() => import("./pages/Servicios"));
// Peluqueria.tsx eliminada — groomers ahora son tab nativo en /services/groomers
const GroomerProfileEdit = lazy(() => import("./pages/GroomerProfileEdit"));
const DirectorioVets = lazy(() => import("./pages/DirectorioVets"));
const PerfilVetPublico = lazy(() => import("./pages/PerfilVetPublico"));
const Demo = lazy(() => import("./pages/Demo"));
const ProviderProfileEdit = lazy(() => import("./pages/ProviderProfileEdit"));
const RegistroVeterinario = lazy(() => import("./pages/RegistroVeterinario"));
const ParaVeterinarios = lazy(() => import("./pages/ParaVeterinarios"));
const PreciosVeterinarios = lazy(() => import("./pages/PreciosVeterinarios"));
const DejarResena = lazy(() => import("./pages/DejarResena"));
const QRLanding = lazy(() => import("./pages/QRLanding"));
const Actividad = lazy(() => import("./pages/Actividad"));
const Reminders = lazy(() => import("./pages/Reminders"));
const OnboardingVetMinimal = lazy(() => import("./pages/OnboardingVetMinimal"));
const OnboardingDuenoMinimal = lazy(() => import("./pages/OnboardingDuenoMinimal"));
const Reportes = lazy(() => import("./pages/Reportes"));
const EnMemoria = lazy(() => import("./pages/EnMemoria"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/home" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
              <Route path="/feed" element={<ProtectedRoute><AppLayout><Feed /></AppLayout></ProtectedRoute>} />
              <Route path="/actividad" element={<Navigate to="/feed" replace />} />
              <Route path="/my-pets" element={<ProtectedRoute><AppLayout><MyPets /></AppLayout></ProtectedRoute>} />
              <Route path="/add-pet" element={<ProtectedRoute><AppLayout><AddPet /></AppLayout></ProtectedRoute>} />
              <Route path="/edit-pet/:petId" element={<ProtectedRoute><AppLayout><AddPet /></AppLayout></ProtectedRoute>} />
              <Route path="/medical-records" element={<ProtectedRoute><AppLayout><MedicalRecords /></AppLayout></ProtectedRoute>} />
              <Route path="/reminders" element={<ProtectedRoute><AppLayout><Reminders /></AppLayout></ProtectedRoute>} />
              <Route path="/adoption" element={<ProtectedRoute><AppLayout><Adoption /></AppLayout></ProtectedRoute>} />

              <Route path="/paw-game" element={<ProtectedRoute><AppLayout><PawGame /></AppLayout></ProtectedRoute>} />
              <Route path="/servicios" element={<ProtectedRoute><AppLayout><Servicios /></AppLayout></ProtectedRoute>} />
              {/* /servicios/peluqueria → redirect a tab nativo */}
              <Route path="/servicios/peluqueria" element={<Navigate to="/services/groomers" replace />} />
              <Route path="/peluquero/perfil" element={<ProtectedRoute><AppLayout><GroomerProfileEdit /></AppLayout></ProtectedRoute>} />
              <Route path="/services/:type" element={<ProtectedRoute><AppLayout><ServiceDirectory /></AppLayout></ProtectedRoute>} />
              {/* Legacy redirects to new unified service routes */}
              <Route path="/dog-walkers" element={<Navigate to="/services/walkers" replace />} />
              <Route path="/home-vets" element={<Navigate to="/services/vets" replace />} />
              <Route path="/dog-sitters" element={<Navigate to="/services/sitters" replace />} />
              <Route path="/dog-trainers" element={<Navigate to="/services/trainers" replace />} />
              {/* /shared-walks y /lost-pets eliminados en pivot médico */}
              <Route path="/maps" element={<ProtectedRoute><AppLayout><Maps /></AppLayout></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatConversation /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
              <Route path="/user/:userId" element={<ProtectedRoute><AppLayout><UserProfile /></AppLayout></ProtectedRoute>} />
              {/* /checkout eliminado en pivot médico */}
              {/* Pagos: una sola ruta unificada con query param ?status=success|failed */}
              <Route path="/payment-result" element={<ProtectedRoute><PaymentResult /></ProtectedRoute>} />
              <Route path="/payment-success" element={<Navigate to="/payment-result?status=success" replace />} />
              <Route path="/payment-failed" element={<Navigate to="/payment-result?status=failed" replace />} />
              <Route path="/admin" element={<AdminRoute><AppLayout><Admin /></AppLayout></AdminRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
              <Route path="/en-memoria" element={<ProtectedRoute><AppLayout><EnMemoria /></AppLayout></ProtectedRoute>} />
              <Route path="/provider/dashboard" element={<ProtectedRoute><AppLayout><ProviderDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/provider/profile-edit" element={<ProtectedRoute><AppLayout><ProviderProfileEdit /></AppLayout></ProtectedRoute>} />
              <Route path="/pet/:petId/clinical" element={<ProtectedRoute><AppLayout><PetClinicalRecord /></AppLayout></ProtectedRoute>} />
              <Route path="/mis-reservas" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
              <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
              <Route path="/upgrade/success" element={<ProtectedRoute><UpgradeSuccess /></ProtectedRoute>} />
              <Route path="/upgrade/cancel" element={<ProtectedRoute><UpgradeCancel /></ProtectedRoute>} />
              <Route path="/calendar" element={<Navigate to="/mis-reservas" replace />} />
              {/* Directorio público de veterinarios (sin login).
                  Si el user está logueado, lo envolvemos con AppLayout para
                  mantener header/sidebar consistente con el resto de la app. */}
              <Route path="/veterinarios" element={<PublicWithLayoutIfAuth><DirectorioVets /></PublicWithLayoutIfAuth>} />
              <Route path="/veterinarios/comuna/:comuna" element={<PublicWithLayoutIfAuth><DirectorioVets /></PublicWithLayoutIfAuth>} />
              <Route path="/veterinarios/especialidad/:especialidad" element={<PublicWithLayoutIfAuth><DirectorioVets /></PublicWithLayoutIfAuth>} />
              <Route path="/veterinarios/:slug" element={<PublicWithLayoutIfAuth><PerfilVetPublico /></PublicWithLayoutIfAuth>} />
              {/* Demo en vivo (uso interno para reuniones de venta) */}
              <Route path="/demo" element={<Demo />} />
              <Route path="/onboarding-mascota" element={<ProtectedRoute><OnboardingDuenoMinimal /></ProtectedRoute>} />
              <Route path="/onboarding-vet" element={<ProtectedRoute><OnboardingVetMinimal /></ProtectedRoute>} />
              <Route path="/reportes" element={<ProtectedRoute><AppLayout><Reportes /></AppLayout></ProtectedRoute>} />
              <Route path="/registro-veterinario" element={<RegistroVeterinario />} />
              <Route path="/para-veterinarios" element={<ParaVeterinarios />} />
              <Route path="/precios-veterinarios" element={<PublicWithLayoutIfAuth><PreciosVeterinarios /></PublicWithLayoutIfAuth>} />
              <Route path="/precios-veterinarios/comuna/:comuna" element={<PublicWithLayoutIfAuth><PreciosVeterinarios /></PublicWithLayoutIfAuth>} />
              <Route path="/resena/:token" element={<DejarResena />} />
              <Route path="/qr/:token" element={<QRLanding />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
