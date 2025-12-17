import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { CartProvider } from "./contexts/CartContext";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Places from "./pages/Places";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import MyPets from "./pages/MyPets";
import AddPet from "./pages/AddPet";
import MedicalRecords from "./pages/MedicalRecords";
import Adoption from "./pages/Adoption";
import Gamification from "./pages/Gamification";
import PawGame from "./pages/PawGame";
import DogWalkers from "./pages/DogWalkers";
import HomeVets from "./pages/HomeVets";
import SharedWalks from "./pages/SharedWalks";
import DogSitters from "./pages/DogSitters";
import DogTrainers from "./pages/DogTrainers";
import LostPets from "./pages/LostPets";
import Chat from "./pages/Chat";
import ChatConversation from "./pages/ChatConversation";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import UserProfile from "./pages/UserProfile";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentResult from "./pages/PaymentResult";
import PaymentFailed from "./pages/PaymentFailed";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Maps from "./pages/Maps";
import Premium from "./pages/Premium";
import ProviderDashboard from "./components/provider/ProviderDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/home" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><AppLayout><Feed /></AppLayout></ProtectedRoute>} />
            <Route path="/places" element={<AppLayout><Places /></AppLayout>} />
            <Route path="/my-pets" element={<ProtectedRoute><AppLayout><MyPets /></AppLayout></ProtectedRoute>} />
            <Route path="/add-pet" element={<ProtectedRoute><AppLayout><AddPet /></AppLayout></ProtectedRoute>} />
            <Route path="/medical-records" element={<ProtectedRoute><AppLayout><MedicalRecords /></AppLayout></ProtectedRoute>} />
            <Route path="/adoption" element={<ProtectedRoute><AppLayout><Adoption /></AppLayout></ProtectedRoute>} />
            <Route path="/gamification" element={<ProtectedRoute><AppLayout><Gamification /></AppLayout></ProtectedRoute>} />
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
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
