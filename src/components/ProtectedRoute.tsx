import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, user, loading } = useAuth();

  // Check beta tester status
  const { data: betaStatus, isLoading: betaLoading } = useQuery({
    queryKey: ["beta-status", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const { data } = await supabase
        .from("beta_testers")
        .select("status")
        .eq("email", user!.email!.toLowerCase())
        .single();
      return data?.status ?? null;
    },
  });

  const { data: approved, isLoading: approvalLoading } = useQuery({
    queryKey: ["profile-approved", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("approved")
        .eq("user_id", user!.id)
        .single();
      return data?.approved ?? false;
    },
  });

  if (loading || betaLoading || approvalLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Beta gate: must be in beta_testers with approved status
  if (betaStatus !== "approved") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">You're not in beta yet</h1>
          <p className="text-muted-foreground">
            {betaStatus === "pending"
              ? "Your invite is pending approval. We'll reach out when your spot is ready."
              : betaStatus === "rejected"
              ? "Your beta access has been declined."
              : "You need an invite to access MYTHOS HQ. Ask for an invite from the team."}
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
            className="text-sm text-primary hover:underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!approved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Access Pending</h1>
          <p className="text-muted-foreground">
            Your account hasn't been approved yet. We'll reach out when your spot is ready.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
            className="text-sm text-primary hover:underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
