import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<DashboardLayout />}>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
