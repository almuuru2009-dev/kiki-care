import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import SplashScreen from "./pages/SplashScreen";
import RoleSelectScreen from "./pages/RoleSelectScreen";
import LoginScreen from "./pages/LoginScreen";
import RegisterScreen from "./pages/RegisterScreen";

import KineHome from "./pages/kine/KineHome";
import PatientList from "./pages/kine/PatientList";
import PatientDetail from "./pages/kine/PatientDetail";
import AlertsScreen from "./pages/kine/AlertsScreen";
import MessageList from "./pages/kine/MessageList";
import ConversationScreen from "./pages/kine/ConversationScreen";
import KineProfile from "./pages/kine/KineProfile";

import CuidadoraHome from "./pages/cuidadora/CuidadoraHome";
import SessionPlayer from "./pages/cuidadora/SessionPlayer";
import ProgressScreen from "./pages/cuidadora/ProgressScreen";
import CuidadoraMessages from "./pages/cuidadora/CuidadoraMessages";
import ChildProfile from "./pages/cuidadora/ChildProfile";
import MedalsScreen from "./pages/cuidadora/MedalsScreen";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-navy-900 flex items-start justify-center">
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/role-select" element={<RoleSelectScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />

            <Route path="/kine/home" element={<KineHome />} />
            <Route path="/kine/patients" element={<PatientList />} />
            <Route path="/kine/patients/:id" element={<PatientDetail />} />
            <Route path="/kine/patients/:id/plan/edit" element={<PatientDetail />} />
            <Route path="/kine/patients/:id/pre-report" element={<PatientDetail />} />
            <Route path="/kine/alerts" element={<AlertsScreen />} />
            <Route path="/kine/messages" element={<MessageList />} />
            <Route path="/kine/messages/:id" element={<ConversationScreen />} />
            <Route path="/kine/profile" element={<KineProfile />} />

            <Route path="/cuidadora/home" element={<CuidadoraHome />} />
            <Route path="/cuidadora/session" element={<SessionPlayer />} />
            <Route path="/cuidadora/progress" element={<ProgressScreen />} />
            <Route path="/cuidadora/messages" element={<CuidadoraMessages />} />
            <Route path="/cuidadora/messages/conversation" element={<ConversationScreen />} />
            <Route path="/cuidadora/child" element={<ChildProfile />} />
            <Route path="/cuidadora/medals" element={<MedalsScreen />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
