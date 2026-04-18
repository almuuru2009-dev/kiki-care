import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

import SplashScreen from "./pages/SplashScreen";
import RoleSelectScreen from "./pages/RoleSelectScreen";
import LoginScreen from "./pages/LoginScreen";
import RegisterScreen from "./pages/RegisterScreen";
import ForgotPasswordScreen from "./pages/ForgotPasswordScreen";
import ChangePasswordScreen from "./pages/ChangePasswordScreen";
import FAQScreen from "./pages/FAQScreen";
import TermsScreen from "./pages/TermsScreen";
import PrivacyScreen from "./pages/PrivacyScreen";
import PendingInvitationsScreen from "./pages/PendingInvitationsScreen";
import AuthConfirmScreen from "./pages/AuthConfirmScreen";
import JoinScreen from "./pages/JoinScreen";

import KineHome from "./pages/kine/KineHome";
import PatientList from "./pages/kine/PatientList";
import PatientDetail from "./pages/kine/PatientDetail";
import EditPlanScreen from "./pages/kine/EditPlanScreen";
import AlertsScreen from "./pages/kine/AlertsScreen";
import MessageList from "./pages/kine/MessageList";
import ConversationScreen from "./pages/kine/ConversationScreen";
import KineProfile from "./pages/kine/KineProfile";
import ExerciseLibraryScreen from "./pages/kine/ExerciseLibraryScreen";
import CreateExerciseScreen from "./pages/kine/CreateExerciseScreen";
import EditExerciseScreen from "./pages/kine/EditExerciseScreen";
import CreateProtocolScreen from "./pages/kine/CreateProtocolScreen";
import AgendaScreen from "./pages/kine/AgendaScreen";

import CuidadoraHome from "./pages/cuidadora/CuidadoraHome";
import SessionPlayer from "./pages/cuidadora/SessionPlayer";
import ProgressScreen from "./pages/cuidadora/ProgressScreen";
import CuidadoraMessages from "./pages/cuidadora/CuidadoraMessages";
import ChildProfile from "./pages/cuidadora/ChildProfile";
import MedalsScreen from "./pages/cuidadora/MedalsScreen";
import ExerciseDetailScreen from "./pages/cuidadora/ExerciseDetailScreen";

import OnboardingScreen from "./pages/OnboardingScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<SplashScreen />} />
              <Route path="/role-select" element={<RoleSelectScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
              <Route path="/change-password" element={<ChangePasswordScreen />} />
              <Route path="/faq" element={<FAQScreen />} />
              <Route path="/terms" element={<TermsScreen />} />
              <Route path="/privacy" element={<PrivacyScreen />} />
              <Route path="/auth/confirm" element={<AuthConfirmScreen />} />
              <Route path="/join" element={<ProtectedRoute><JoinScreen /></ProtectedRoute>} />
              <Route path="/pending-invitations" element={<ProtectedRoute><PendingInvitationsScreen /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><OnboardingScreen /></ProtectedRoute>} />

              {/* Kine routes - protected, kinesiologist only */}
              <Route path="/kine/home" element={<ProtectedRoute allowedRole="kinesiologist"><KineHome /></ProtectedRoute>} />
              <Route path="/kine/patients" element={<ProtectedRoute allowedRole="kinesiologist"><PatientList /></ProtectedRoute>} />
              <Route path="/kine/patients/:id" element={<ProtectedRoute allowedRole="kinesiologist"><PatientDetail /></ProtectedRoute>} />
              <Route path="/kine/patients/:id/plan/edit" element={<ProtectedRoute allowedRole="kinesiologist"><EditPlanScreen /></ProtectedRoute>} />
              <Route path="/kine/patients/:id/pre-report" element={<ProtectedRoute allowedRole="kinesiologist"><PatientDetail /></ProtectedRoute>} />
              <Route path="/kine/alerts" element={<ProtectedRoute allowedRole="kinesiologist"><AlertsScreen /></ProtectedRoute>} />
              <Route path="/kine/messages" element={<ProtectedRoute allowedRole="kinesiologist"><MessageList /></ProtectedRoute>} />
              <Route path="/kine/messages/:id" element={<ProtectedRoute allowedRole="kinesiologist"><ConversationScreen /></ProtectedRoute>} />
              <Route path="/kine/profile" element={<ProtectedRoute allowedRole="kinesiologist"><KineProfile /></ProtectedRoute>} />
              <Route path="/kine/exercises" element={<ProtectedRoute allowedRole="kinesiologist"><ExerciseLibraryScreen /></ProtectedRoute>} />
              <Route path="/kine/exercises/create" element={<ProtectedRoute allowedRole="kinesiologist"><CreateExerciseScreen /></ProtectedRoute>} />
              <Route path="/kine/exercises/edit/:id" element={<ProtectedRoute allowedRole="kinesiologist"><EditExerciseScreen /></ProtectedRoute>} />
              <Route path="/kine/exercise/:id" element={<ProtectedRoute allowedRole="kinesiologist"><ExerciseDetailScreen /></ProtectedRoute>} />
              <Route path="/kine/protocols/create" element={<ProtectedRoute allowedRole="kinesiologist"><CreateProtocolScreen /></ProtectedRoute>} />
              <Route path="/kine/agenda" element={<ProtectedRoute allowedRole="kinesiologist"><AgendaScreen /></ProtectedRoute>} />

              {/* Cuidadora routes - protected, caregiver only */}
              <Route path="/cuidadora/home" element={<ProtectedRoute allowedRole="caregiver"><CuidadoraHome /></ProtectedRoute>} />
              <Route path="/cuidadora/session" element={<ProtectedRoute allowedRole="caregiver"><SessionPlayer /></ProtectedRoute>} />
              <Route path="/cuidadora/progress" element={<ProtectedRoute allowedRole="caregiver"><ProgressScreen /></ProtectedRoute>} />
              <Route path="/cuidadora/messages" element={<ProtectedRoute allowedRole="caregiver"><CuidadoraMessages /></ProtectedRoute>} />
              <Route path="/cuidadora/messages/:id" element={<ProtectedRoute allowedRole="caregiver"><ConversationScreen /></ProtectedRoute>} />
              <Route path="/cuidadora/child" element={<ProtectedRoute allowedRole="caregiver"><ChildProfile /></ProtectedRoute>} />
              <Route path="/cuidadora/medals" element={<ProtectedRoute allowedRole="caregiver"><MedalsScreen /></ProtectedRoute>} />
              <Route path="/cuidadora/exercise/:id" element={<ProtectedRoute allowedRole="caregiver"><ExerciseDetailScreen /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
