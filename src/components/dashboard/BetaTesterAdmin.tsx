import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, UserPlus, Trash2, Check, XCircle, Download, Mail } from "lucide-react";
import { toast } from "sonner";

interface BetaTester {
  id: string;
  email: string;
  status: string;
  invited_at: string;
  invited_by: string;
}

export function InviteBetaTesterButton() {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const isAdmin = profile?.full_name === "Shane";

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-3 py-1.5 text-white transition-all duration-150 hover:brightness-110 rounded-[7px]"
        style={{
          background: "linear-gradient(145deg, rgba(93,153,146,0.85), rgba(61,110,104,0.9))",
          border: "1px solid rgba(93,153,146,0.5)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), 0 2px 6px rgba(93,153,146,0.25)",
        }}
      >
        <span className="flex items-center gap-1.5">
          <UserPlus size={12} />
          Invite Tester
        </span>
      </button>
      {open && <InviteModal onClose={() => setOpen(false)} />}
    </>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Enter a valid email.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("beta_testers").insert({
      email: trimmed,
      status: "approved",
      invited_by: "shane",
    });
    setLoading(false);
    if (error?.code === "23505") {
      toast.error("Email already invited.");
      return;
    }
    if (error) {
      toast.error("Failed to invite.");
      return;
    }
    toast.success(`${trimmed} invited & approved!`);
    queryClient.invalidateQueries({ queryKey: ["beta-testers"] });
    setEmail("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Mail size={14} className="text-primary" /> Invite Beta Tester
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tester@example.com"
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <p className="text-[10px] text-muted-foreground mt-2">User will be auto-approved and can sign up immediately.</p>
        <button
          onClick={handleInvite}
          disabled={loading}
          className="w-full mt-4 bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {loading ? "Inviting..." : "Send Invite →"}
        </button>
      </div>
    </div>
  );
}

export function BetaTesterAdminPanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: testers = [], isLoading } = useQuery({
    queryKey: ["beta-testers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("beta_testers")
        .select("*")
        .order("invited_at", { ascending: false });
      return (data ?? []) as BetaTester[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from("beta_testers").update({ status }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["beta-testers"] }),
  });

  const removeTester = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("beta_testers").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beta-testers"] });
      toast.success("Tester removed.");
    },
  });

  const exportList = () => {
    const csv = "Email,Status,Invited At,Invited By\n" +
      testers.map((t) => `${t.email},${t.status},${t.invited_at},${t.invited_by}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "beta_testers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (s: string) =>
    s === "approved" ? "text-emerald-400 bg-emerald-400/10" :
    s === "rejected" ? "text-red-400 bg-red-400/10" :
    "text-amber-400 bg-amber-400/10";

  return (
    <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Beta Testers ({testers.length})</h3>
          <div className="flex items-center gap-2">
            <button onClick={exportList} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Download size={12} /> Export CSV
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-xs">Loading...</div>
          ) : testers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">No beta testers yet.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border">
                  <th className="text-left py-2 font-medium">Email</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Invited</th>
                  <th className="text-right py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testers.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2 text-foreground">{t.email}</td>
                    <td className="py-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">{new Date(t.invited_at).toLocaleDateString()}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {t.status !== "approved" && (
                          <button
                            onClick={() => updateStatus.mutate({ id: t.id, status: "approved" })}
                            className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400" title="Approve"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        {t.status !== "rejected" && (
                          <button
                            onClick={() => updateStatus.mutate({ id: t.id, status: "rejected" })}
                            className="p-1 rounded hover:bg-red-500/10 text-red-400" title="Reject"
                          >
                            <XCircle size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => removeTester.mutate(t.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400" title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
