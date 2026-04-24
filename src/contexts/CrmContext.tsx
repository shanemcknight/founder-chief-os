import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Stage is now a free-form text label defined per-pipeline.
// Kept as string for backward compatibility with the contacts.stage column.
export type Stage = string;

// Legacy fixed stages — kept for any leftover references but no longer the source of truth.
export const STAGES: { key: string; label: string }[] = [
  { key: "new_lead", label: "NEW LEAD" },
  { key: "contacted", label: "CONTACTED" },
  { key: "sample_sent", label: "SAMPLE SENT" },
  { key: "tasting_done", label: "TASTING DONE" },
  { key: "proposal_sent", label: "PROPOSAL SENT" },
  { key: "won", label: "WON" },
  { key: "lost", label: "LOST" },
];

export const PIPELINE_COLORS = [
  { key: "primary", className: "bg-primary", hex: "hsl(var(--primary))" },
  { key: "amber", className: "bg-amber-500", hex: "#f59e0b" },
  { key: "blue", className: "bg-blue-500", hex: "#3b82f6" },
  { key: "green", className: "bg-emerald-500", hex: "#10b981" },
  { key: "purple", className: "bg-purple-500", hex: "#a855f7" },
  { key: "red", className: "bg-rose-500", hex: "#f43f5e" },
] as const;

export type Pipeline = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  stages: string[];
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Company = {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  location: string | null;
  created_at: string;
};

export type Contact = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company_id: string | null;
  pipeline_id: string | null;
  stage: Stage;
  value: number;
  location: string | null;
  tags: string[];
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
};

export type Activity = {
  id: string;
  user_id: string;
  contact_id: string | null;
  type: string;
  description: string | null;
  created_at: string;
};

export type CrmTask = {
  id: string;
  user_id: string;
  contact_id: string | null;
  title: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
};

type CrmContextValue = {
  loading: boolean;
  contacts: Contact[];
  companies: Company[];
  activities: Activity[];
  tasks: CrmTask[];
  pipelines: Pipeline[];
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
  createContact: (data: Partial<Contact> & { name: string }) => Promise<Contact | null>;
  updateContact: (id: string, patch: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  createCompany: (data: Partial<Company> & { name: string }) => Promise<Company | null>;
  logActivity: (contactId: string, type: string, description: string) => Promise<void>;
  createTask: (contactId: string | null, title: string, dueDate?: string | null) => Promise<void>;
  toggleTask: (id: string, completed: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createPipeline: (data: { name: string; description?: string; color?: string; stages?: string[] }) => Promise<Pipeline | null>;
  updatePipeline: (id: string, patch: Partial<Pipeline>) => Promise<void>;
  deletePipeline: (id: string) => Promise<void>;
  duplicatePipeline: (id: string) => Promise<Pipeline | null>;
};

const CrmContext = createContext<CrmContextValue | null>(null);

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside CrmProvider");
  return ctx;
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [c, co, a, t, p] = await Promise.all([
        supabase.from("contacts").select("*").order("created_at", { ascending: false }),
        supabase.from("companies").select("*").order("created_at", { ascending: false }),
        supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("crm_tasks").select("*").order("due_date", { ascending: true, nullsFirst: false }),
        supabase.from("pipelines" as any).select("*").order("sort_order", { ascending: true }),
      ]);
      if (cancelled) return;
      setContacts((c.data as Contact[]) || []);
      setCompanies((co.data as Company[]) || []);
      setActivities((a.data as Activity[]) || []);
      setTasks((t.data as CrmTask[]) || []);
      setPipelines(((p.data as any[]) || []).map((row) => ({
        ...row,
        stages: Array.isArray(row.stages) ? row.stages : (typeof row.stages === "string" ? JSON.parse(row.stages) : []),
      })) as Pipeline[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Realtime contacts
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("crm-contacts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setContacts((prev) =>
              prev.some((c) => c.id === (payload.new as Contact).id) ? prev : [payload.new as Contact, ...prev]
            );
          } else if (payload.eventType === "UPDATE") {
            setContacts((prev) => prev.map((c) => (c.id === (payload.new as Contact).id ? (payload.new as Contact) : c)));
          } else if (payload.eventType === "DELETE") {
            setContacts((prev) => prev.filter((c) => c.id !== (payload.old as Contact).id));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createContact = useCallback<CrmContextValue["createContact"]>(
    async (data) => {
      if (!user) return null;
      const { data: row, error } = await supabase
        .from("contacts")
        .insert({ ...data, user_id: user.id } as any)
        .select()
        .single();
      if (error) {
        toast.error("Failed to create contact");
        return null;
      }
      setContacts((prev) => [row as Contact, ...prev.filter((c) => c.id !== (row as Contact).id)]);
      return row as Contact;
    },
    [user]
  );

  const updateContact = useCallback<CrmContextValue["updateContact"]>(async (id, patch) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error } = await supabase.from("contacts").update(patch as any).eq("id", id);
    if (error) toast.error("Failed to update contact");
  }, []);

  const deleteContact = useCallback<CrmContextValue["deleteContact"]>(async (id) => {
    const prev = contacts;
    setContacts((p) => p.filter((c) => c.id !== id));
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) {
      setContacts(prev);
      toast.error("Failed to delete contact");
    }
  }, [contacts]);

  const createCompany = useCallback<CrmContextValue["createCompany"]>(
    async (data) => {
      if (!user) return null;
      const { data: row, error } = await supabase
        .from("companies")
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      if (error) {
        toast.error("Failed to create company");
        return null;
      }
      setCompanies((prev) => [row as Company, ...prev]);
      return row as Company;
    },
    [user]
  );

  const logActivity = useCallback<CrmContextValue["logActivity"]>(
    async (contactId, type, description) => {
      if (!user) return;
      const { data: row, error } = await supabase
        .from("activities")
        .insert({ user_id: user.id, contact_id: contactId, type, description })
        .select()
        .single();
      if (error) {
        toast.error("Failed to log activity");
        return;
      }
      setActivities((prev) => [row as Activity, ...prev]);
      await supabase.from("contacts").update({ last_contacted_at: new Date().toISOString() }).eq("id", contactId);
      setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, last_contacted_at: new Date().toISOString() } : c)));
    },
    [user]
  );

  const createTask = useCallback<CrmContextValue["createTask"]>(
    async (contactId, title, dueDate) => {
      if (!user) return;
      const { data: row, error } = await supabase
        .from("crm_tasks")
        .insert({ user_id: user.id, contact_id: contactId, title, due_date: dueDate || null })
        .select()
        .single();
      if (error) {
        toast.error("Failed to create task");
        return;
      }
      setTasks((prev) => [row as CrmTask, ...prev]);
    },
    [user]
  );

  const toggleTask = useCallback<CrmContextValue["toggleTask"]>(async (id, completed) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    const { error } = await supabase.from("crm_tasks").update({ completed }).eq("id", id);
    if (error) toast.error("Failed to update task");
  }, []);

  const deleteTask = useCallback<CrmContextValue["deleteTask"]>(async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("crm_tasks").delete().eq("id", id);
  }, []);

  // ---- Pipelines ----
  const createPipeline = useCallback<CrmContextValue["createPipeline"]>(
    async (data) => {
      if (!user) return null;
      const stages = data.stages && data.stages.length > 0 ? data.stages : ["New Lead", "Contacted", "Proposal Sent", "Won", "Lost"];
      const sort_order = pipelines.length;
      const { data: row, error } = await supabase
        .from("pipelines" as any)
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description || "",
          color: data.color || "primary",
          stages: stages as any,
          sort_order,
        } as any)
        .select()
        .single();
      if (error) {
        toast.error("Failed to create pipeline");
        return null;
      }
      const pipeline = { ...(row as any), stages } as Pipeline;
      setPipelines((prev) => [...prev, pipeline]);
      return pipeline;
    },
    [user, pipelines.length]
  );

  const updatePipeline = useCallback<CrmContextValue["updatePipeline"]>(async (id, patch) => {
    setPipelines((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } as Pipeline : p)));
    const { error } = await supabase.from("pipelines" as any).update(patch as any).eq("id", id);
    if (error) toast.error("Failed to update pipeline");
  }, []);

  const deletePipeline = useCallback<CrmContextValue["deletePipeline"]>(async (id) => {
    const prev = pipelines;
    setPipelines((p) => p.filter((pl) => pl.id !== id));
    // Clear pipeline_id on local contacts
    setContacts((prevContacts) => prevContacts.map((c) => (c.pipeline_id === id ? { ...c, pipeline_id: null } : c)));
    const { error } = await supabase.from("pipelines" as any).delete().eq("id", id);
    if (error) {
      setPipelines(prev);
      toast.error("Failed to delete pipeline");
    }
  }, [pipelines]);

  const duplicatePipeline = useCallback<CrmContextValue["duplicatePipeline"]>(
    async (id) => {
      const src = pipelines.find((p) => p.id === id);
      if (!src) return null;
      return await createPipeline({
        name: `${src.name} (copy)`,
        description: src.description,
        color: src.color,
        stages: [...src.stages],
      });
    },
    [pipelines, createPipeline]
  );

  return (
    <CrmContext.Provider
      value={{
        loading,
        contacts,
        companies,
        activities,
        tasks,
        pipelines,
        selectedContactId,
        setSelectedContactId,
        createContact,
        updateContact,
        deleteContact,
        createCompany,
        logActivity,
        createTask,
        toggleTask,
        deleteTask,
        createPipeline,
        updatePipeline,
        deletePipeline,
        duplicatePipeline,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}
