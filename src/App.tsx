import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import CommandPage from "./pages/CommandPage";
import SalesPage from "./pages/SalesPage";
import PublishPage from "./pages/PublishPage";
import ChiefPage from "./pages/ChiefPage";
import BuildPage from "./pages/BuildPage";
import SettingsPage from "./pages/SettingsPage";
import OnboardingPage from "./pages/OnboardingPage";
import AgentDeployPage from "./pages/AgentDeployPage";
import CalendarPage from "./pages/CalendarPage";
import LoginPage from "./pages/LoginPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import DataDeletionPage from "./pages/DataDeletionPage";
import BetaPage from "./pages/BetaPage";
import BetaInvitePage from "./pages/BetaInvitePage";
import PricingPage from "./pages/PricingPage";
import WhiteLabelPage from "./pages/WhiteLabelPage";
import FoodPeoplePage from "./pages/FoodPeoplePage";

// Social sub-pages
import SocialLayout from "./pages/social/SocialLayout";
import SocialCalendarPage from "./pages/social/SocialCalendarPage";
import SocialApprovalsPage from "./pages/social/SocialApprovalsPage";
import SocialPipelinePage from "./pages/social/SocialPipelinePage";
import SocialLibraryPage from "./pages/social/SocialLibraryPage";
import SocialPerformancePage from "./pages/social/SocialPerformancePage";
import SocialStrategyPage from "./pages/social/SocialStrategyPage";

// Inbox sub-pages
import InboxLayout from "./pages/inbox/InboxLayout";
import InboxMailPage from "./pages/inbox/InboxMailPage";
import InboxApprovalsPage from "./pages/inbox/InboxApprovalsPage";
import InboxQueuePage from "./pages/inbox/InboxQueuePage";
import InboxAlertsPage from "./pages/inbox/InboxAlertsPage";
import InboxActivityPage from "./pages/inbox/InboxActivityPage";

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
            <Route path="/beta" element={<BetaPage />} />
            <Route path="/beta/:code" element={<BetaInvitePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/white-label" element={<WhiteLabelPage />} />
            <Route path="/for/food-people" element={<FoodPeoplePage />} />
            <Route path="/onboarding" element={<Navigate to="/beta" replace />} />
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<CommandPage />} />
              <Route path="/social" element={<SocialLayout />}>
                <Route index element={<SocialCalendarPage />} />
                <Route path="calendar" element={<SocialCalendarPage />} />
                <Route path="approvals" element={<SocialApprovalsPage />} />
                <Route path="pipeline" element={<SocialPipelinePage />} />
                <Route path="library" element={<SocialLibraryPage />} />
                <Route path="performance" element={<SocialPerformancePage />} />
                <Route path="strategy" element={<SocialStrategyPage />} />
              </Route>
              <Route path="/inbox" element={<InboxLayout />}>
                <Route index element={<Navigate to="/inbox/mail" replace />} />
                <Route path="mail" element={<InboxMailPage />} />
                <Route path="approvals" element={<InboxApprovalsPage />} />
                <Route path="queue" element={<InboxQueuePage />} />
                <Route path="alerts" element={<InboxAlertsPage />} />
                <Route path="activity" element={<InboxActivityPage />} />
              </Route>
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/publish" element={<PublishPage />} />
              <Route path="/chief" element={<ChiefPage />} />
              <Route path="/build" element={<BuildPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
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
