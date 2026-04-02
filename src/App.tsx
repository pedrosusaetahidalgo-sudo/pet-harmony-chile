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
const DogWalkers = lazy(() => import("./pages/DogWalkers"));
const HomeVets = lazy(() => import("./pages/HomeVets"));
const SharedWalks = lazy(() => import("./pages/SharedWalks"));
const DogSitters = lazy(() => import("./pages/DogSitters"));
const DogTrainers = lazy(() => import("./pages/DogTrainers"));
const LostPets = lazy(() => import("./pages/LostPets"));
const Chat = lazy(() => import("./pages/Chat"));
const ChatConversation = lazy(() => import("./pages/ChatConversation"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const Maps = lazy(() => import("./pages/Maps"));
const Premium = lazy(() => import("./pages/Premium"));
const ProviderDashboard = lazy(() => import("./components/provider/ProviderDashboard"));
const PetClinicalRecord = lazy(() => import("./pages/PetClinicalRecord"));
const ServiceCalendar = lazy(() => import("./pages/ServiceCalendar"));

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
              <Route path="/medical-records" element={<ProtectedRoute><AppLayout><MedicalRecords /></AppLayout></ProtectedRoute>} />
              <Route path="/adoption" element={<ProtectedRoute><AppLayout><Adoption /></AppLayout></ProtectedRoute>} />

              <Route path="/paw-game" element={<ProtectedRoute><AppLayout><PawGame /></AppLayout></ProtectedRoute>} />
              <Route path="/dog-walkers" element={<ProtectedRoute><AppLayout><DogWalkers /></AppLayout></ProtectedRoute>} />
              <Route path="/home-vets" element={<ProtectedRoute><AppLayout><HomeVets /></AppLayout></ProtectedRoute>} />
              <Route path="/shared-walks" element={<ProtectedRoute><AppLayout><SharedWalks /></AppLayout></ProtectedRoute>} />
              <Route path="/dog-sitters" element={<ProtectedRoute><AppLayout><DogSitters /></AppLayout></ProtectedRoute>} />
              <Route path="/dog-trainers" element={<ProtectedRoute><AppLayout><DogTrainers /></AppLayout></ProtectedRoute>} />
              <Route path="/lost-pets" element={<ProtectedRoute><AppLayout><LostPets /></AppLayout></ProtectedRoute>} />
              <Route path="/maps" element={<ProtectedRoute><AppLayout><Maps /></AppLayout></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatConversation /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
              <Route path="/user/:userId" element={<ProtectedRoute><AppLayout><UserProfile /></AppLayout></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
              <Route path="/payment-result" element={<ProtectedRoute><PaymentResult /></ProtectedRoute>} />
              <Route path="/payment-failed" element={<ProtectedRoute><PaymentFailed /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AppLayout><Admin /></AppLayout></AdminRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
              <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
              <Route path="/provider/dashboard" element={<ProtectedRoute><AppLayout><ProviderDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/pet/:petId/clinical" element={<ProtectedRoute><AppLayout><PetClinicalRecord /></AppLayout></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><ServiceCalendar /></ProtectedRoute>} />
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
