import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  full_name: string | null;
  business_name: string | null;
  approved: boolean;
  environment: "production" | "sandbox";
  is_admin: boolean;
  api_keys_connected: boolean;
  openai_api_key?: string | null;
  gemini_api_key?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setEnvironment: (env: "production" | "sandbox") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = "shane@tophatprovisions.com";

  const fetchProfile = async (userId: string, email?: string) => {
    if (email?.toLowerCase() === ADMIN_EMAIL) {
      setProfile({
        full_name: "Shane",
        business_name: "Top Hat Provisions",
        approved: true,
        environment: "production",
        is_admin: true,
        api_keys_connected: false,
      });
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("full_name, business_name, approved, environment, is_admin, api_keys_connected, openai_api_key, gemini_api_key")
      .eq("user_id", userId)
      .single();
    setProfile(data as UserProfile | null);
  };

  const setEnvironment = async (env: "production" | "sandbox") => {
    if (!user) return;
    await supabase.from("profiles").update({ environment: env }).eq("user_id", user.id);
    setProfile((prev) => prev ? { ...prev, environment: env } : prev);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id, session.user.email ?? undefined), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? undefined);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signUp, signIn, signOut, setEnvironment }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
