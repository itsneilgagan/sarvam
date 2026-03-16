import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import LocationBanner from "@/components/LocationBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Browse from "./pages/Browse";
import ServiceDetail from "./pages/ServiceDetail";
import CreateService from "./pages/CreateService";
import EditServicePage from "./pages/EditServicePage";
import ProfilePage from "./pages/Profile";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <LocationBanner />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/services/new" element={
              <ProtectedRoute requiredRole="provider">
                <CreateService />
              </ProtectedRoute>
            } />
            <Route path="/services/:id/edit" element={
              <ProtectedRoute requiredRole="provider">
                <EditServicePage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
