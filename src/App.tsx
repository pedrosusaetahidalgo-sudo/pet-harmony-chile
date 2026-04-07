import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";

import ProtectedRoute from "./components/ProtectedRoute";
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
const ServiceCalendar = lazy(() => import("./pages/ServiceCalendar"));
const Servicios = lazy(() => import("./pages/Servicios"));
// Peluqueria.tsx eliminada — groomers ahora son tab nativo en /services/groomers
const GroomerProfileEdit = lazy(() => import("./pages/GroomerProfileEdit"));
const DirectorioVets = lazy(() => import("./pages/DirectorioVets"));
const PerfilVetPublico = lazy(() => import("./pages/PerfilVetPublico"));
const Demo = lazy(() => import("./pages/Demo"));
const ProviderProfileEdit = lazy(() => import("./pages/ProviderProfileEdit"));
const RegistroVeterinario = lazy(() => import("./pages/RegistroVeterinario"));
const ParaVeterinarios = lazy(() => import("./pages/ParaVeterinarios"));
const DejarResena = lazy(() => import("./pages/DejarResena"));

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
              <Route path="/places" element={<Navigate to="/home" replace />} />
              <Route path="/my-pets" element={<ProtectedRoute><AppLayout><MyPets /></AppLayout></ProtectedRoute>} />
              <Route path="/add-pet" element={<ProtectedRoute><AppLayout><AddPet /></AppLayout></ProtectedRoute>} />
              <Route path="/edit-pet/:petId" element={<ProtectedRoute><AppLayout><AddPet /></AppLayout></ProtectedRoute>} />
              <Route path="/medical-records" element={<ProtectedRoute><AppLayout><MedicalRecords /></AppLayout></ProtectedRoute>} />
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
              <Route path="/provider/dashboard" element={<ProtectedRoute><AppLayout><ProviderDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/provider/profile-edit" element={<ProtectedRoute><AppLayout><ProviderProfileEdit /></AppLayout></ProtectedRoute>} />
              <Route path="/pet/:petId/clinical" element={<ProtectedRoute><AppLayout><PetClinicalRecord /></AppLayout></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><ServiceCalendar /></ProtectedRoute>} />
              {/* Directorio público de veterinarios (sin login) */}
              <Route path="/veterinarios" element={<DirectorioVets />} />
              <Route path="/veterinarios/comuna/:comuna" element={<DirectorioVets />} />
              <Route path="/veterinarios/especialidad/:especialidad" element={<DirectorioVets />} />
              <Route path="/veterinarios/:slug" element={<PerfilVetPublico />} />
              {/* Demo en vivo (uso interno para reuniones de venta) */}
              <Route path="/demo" element={<Demo />} />
              <Route path="/registro-veterinario" element={<RegistroVeterinario />} />
              <Route path="/para-veterinarios" element={<ParaVeterinarios />} />
              <Route path="/resena/:token" element={<DejarResena />} />
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
