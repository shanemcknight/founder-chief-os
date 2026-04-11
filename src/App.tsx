import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import CommandPage from "./pages/CommandPage";
import SocialPage from "./pages/SocialPage";
import SalesPage from "./pages/SalesPage";
import InboxPage from "./pages/InboxPage";
import PublishPage from "./pages/PublishPage";
import ChiefPage from "./pages/ChiefPage";
import BuildPage from "./pages/BuildPage";
import SettingsPage from "./pages/SettingsPage";
import OnboardingPage from "./pages/OnboardingPage";
import AgentDeployPage from "./pages/AgentDeployPage";
import LoginPage from "./pages/LoginPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import DataDeletionPage from "./pages/DataDeletionPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/data-deletion" element={<DataDeletionPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<CommandPage />} />
              <Route path="/social" element={<SocialPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/publish" element={<PublishPage />} />
              <Route path="/chief" element={<ChiefPage />} />
              <Route path="/build" element={<BuildPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/agents/new" element={<AgentDeployPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
