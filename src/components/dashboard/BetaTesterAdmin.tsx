import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, UserPlus, Trash2, Check, XCircle, Download, Mail, Link2, Copy, Ban } from "lucide-react";
import { toast } from "sonner";

interface BetaTester {
  id: string;
  email: string;
  status: string;
  invited_at: string;
  invited_by: string;
}

interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  created_at: string;
  used_by: string | null;
  used_at: string | null;
  status: string;
  max_uses: number;
  uses: number;
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BETA-";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function InviteBetaTesterButton() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const { profile } = useAuth();
  const isAdmin = profile?.full_name === "Shane";

  if (!isAdmin) return null;

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setShowEmailModal(true)}
          className="text-xs font-semibold px-3 py-1.5 text-white transition-all duration-150 hover:brightness-110 rounded-[7px]"
          style={{
            background: "linear-gradient(145deg, rgba(93,153,146,0.85), rgba(61,110,104,0.9))",
            border: "1px solid rgba(93,153,146,0.5)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), 0 2px 6px rgba(93,153,146,0.25)",
          }}
        >
          <span className="flex items-center gap-1.5">
            <UserPlus size={12} />
            Invite
          </span>
        </button>
        <button
          onClick={() => setShowLinkModal(true)}
          className="text-xs font-semibold px-3 py-1.5 text-white transition-all duration-150 hover:brightness-110 rounded-[7px]"
          style={{
            background: "linear-gradient(145deg, rgba(93,153,146,0.85), rgba(61,110,104,0.9))",
            border: "1px solid rgba(93,153,146,0.5)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), 0 2px 6px rgba(93,153,146,0.25)",
          }}
        >
          <span className="flex items-center gap-1.5">
            <Link2 size={12} />
            Beta Link
          </span>
        </button>
      </div>
      {showEmailModal && <InviteModal onClose={() => setShowEmailModal(false)} />}
      {showLinkModal && <GenerateLinkModal onClose={() => setShowLinkModal(false)} />}
    </>
  );
}

function GenerateLinkModal({ onClose }: { onClose: () => void }) {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState(1);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    setLoading(true);
    const code = generateCode();
    const { error } = await supabase.from("beta_invite_codes").insert({
      code,
      max_uses: maxUses,
      created_by: "shane",
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to generate code.");
      return;
    }
    setGeneratedCode(code);
    queryClient.invalidateQueries({ queryKey: ["beta-invite-codes"] });
    toast.success("Invite link generated!");
  };

  const inviteUrl = generatedCode
    ? `${window.location.origin}/beta/${generatedCode}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Link2 size={14} className="text-primary" /> Generate Beta Link
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>

        {!generatedCode ? (
          <>
            <div className="mb-4">
              <label className="text-xs font-medium text-foreground block mb-1">Max Uses</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={100}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <p className="text-[10px] text-muted-foreground mt-1">How many people can use this link.</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {loading ? "Generating..." : "Generate Invite Link →"}
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Share this link with anyone to invite them:</p>
            <div className="bg-background border border-border rounded-lg px-3 py-2.5 flex items-center gap-2">
              <code className="text-xs text-foreground flex-1 truncate">{inviteUrl}</code>
              <button onClick={handleCopy} className="text-primary hover:text-primary/80 shrink-0">
                <Copy size={14} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Code: <span className="font-mono text-foreground">{generatedCode}</span> · Max uses: {maxUses}
            </p>
            <button
              onClick={() => { setGeneratedCode(null); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-2"
            >
              Generate Another
            </button>
          </div>
        )}
      </div>
    </div>
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
  const [tab, setTab] = useState<"testers" | "codes">("testers");
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

  const { data: codes = [], isLoading: codesLoading } = useQuery({
    queryKey: ["beta-invite-codes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("beta_invite_codes")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as InviteCode[];
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

  const revokeCode = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("beta_invite_codes").update({ status: "revoked" }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beta-invite-codes"] });
      toast.success("Code revoked.");
    },
  });

  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("beta_invite_codes").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beta-invite-codes"] });
      toast.success("Code deleted.");
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

  const codeStatusColor = (s: string) =>
    s === "active" ? "text-emerald-400 bg-emerald-400/10" :
    s === "used" ? "text-blue-400 bg-blue-400/10" :
    "text-red-400 bg-red-400/10";

  return (
    <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTab("testers")}
              className={`text-sm font-bold ${tab === "testers" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Testers ({testers.length})
            </button>
            <button
              onClick={() => setTab("codes")}
              className={`text-sm font-bold ${tab === "codes" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Invite Codes ({codes.length})
            </button>
          </div>
          <div className="flex items-center gap-2">
            {tab === "testers" && (
              <button onClick={exportList} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Download size={12} /> Export
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {tab === "testers" ? (
            isLoading ? (
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
                            <button onClick={() => updateStatus.mutate({ id: t.id, status: "approved" })} className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400" title="Approve"><Check size={12} /></button>
                          )}
                          {t.status !== "rejected" && (
                            <button onClick={() => updateStatus.mutate({ id: t.id, status: "rejected" })} className="p-1 rounded hover:bg-red-500/10 text-red-400" title="Reject"><XCircle size={12} /></button>
                          )}
                          <button onClick={() => removeTester.mutate(t.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400" title="Remove"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            codesLoading ? (
              <div className="text-center py-8 text-muted-foreground text-xs">Loading...</div>
            ) : codes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">No invite codes yet. Generate one from the top bar.</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border">
                    <th className="text-left py-2 font-medium">Code</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Uses</th>
                    <th className="text-left py-2 font-medium">Used By</th>
                    <th className="text-left py-2 font-medium">Created</th>
                    <th className="text-right py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-2 font-mono text-foreground">{c.code}</td>
                      <td className="py-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${codeStatusColor(c.status)}`}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">{c.uses}/{c.max_uses}</td>
                      <td className="py-2 text-muted-foreground">{c.used_by || "—"}</td>
                      <td className="py-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/beta/${c.code}`);
                              toast.success("Link copied!");
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Copy Link"
                          >
                            <Copy size={12} />
                          </button>
                          {c.status === "active" && (
                            <button onClick={() => revokeCode.mutate(c.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400" title="Revoke"><Ban size={12} /></button>
                          )}
                          <button onClick={() => deleteCode.mutate(c.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400" title="Delete"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
