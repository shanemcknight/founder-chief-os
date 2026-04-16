import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, UserX, Loader2, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const industries = [
  "E-Commerce / Retail",
  "SaaS / Software",
  "Agency / Consulting",
  "Finance / Fintech",
  "Healthcare",
  "Real Estate",
  "Education",
  "Media / Entertainment",
  "Manufacturing",
  "Other",
];

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

type DangerMode = null | "data" | "account";

export default function AccountSettings() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [businessName, setBusinessName] = useState(profile?.business_name || "");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [dangerMode, setDangerMode] = useState<DangerMode>(null);
  const [confirmText, setConfirmText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/export-account-data`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `mythoshq-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success("Data export downloaded");
    } catch (err) {
      console.error("export error:", err);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, business_name: businessName })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile saved");
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const closeDanger = () => {
    if (processing) return;
    setDangerMode(null);
    setConfirmText("");
  };

  const expectedConfirm = dangerMode === "account" ? "DELETE MY ACCOUNT" : "DELETE";
  const canConfirm = confirmText === expectedConfirm && !processing;

  const handleDangerConfirm = async () => {
    if (!dangerMode || !canConfirm) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { type: dangerMode },
      });
      if (error || (data as { error?: string })?.error) {
        throw new Error(error?.message || (data as { error?: string })?.error || "Request failed");
      }
      if (dangerMode === "data") {
        toast.success("All data cleared");
        setDangerMode(null);
        setConfirmText("");
        navigate("/onboarding");
      } else {
        await signOut();
        navigate("/");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (dangerMode === "data") {
        toast.error("Failed to clear data. Please try again.");
      } else {
        toast.error("Failed to delete account. Contact hello@mythoshq.io");
      }
      console.error("delete-account error:", msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">Account</h2>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-full text-lg font-bold flex items-center justify-center text-white shrink-0"
            style={{
              background: "linear-gradient(145deg, rgba(93,153,146,0.9), rgba(61,110,104,0.95))",
              border: "1px solid rgba(93,153,146,0.6)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), 0 2px 8px rgba(93,153,146,0.3)",
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <button className="text-[11px] text-primary hover:underline mt-1">Change Photo</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Full Name" value={fullName} onChange={setFullName} />
          <Field label="Business Name" value={businessName} onChange={setBusinessName} />
          <Field label="Website URL" value={website} onChange={setWebsite} placeholder="https://yoursite.com" />
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="">Select industry…</option>
              {industries.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="text-xs font-semibold px-5 py-2 rounded-lg text-white transition-all duration-150 hover:brightness-110 disabled:opacity-50"
          style={{ background: "#5D9992" }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Password */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Change Password</h3>
        <div className="space-y-3 max-w-sm mb-4">
          <Field label="Current Password" value={currentPassword} onChange={setCurrentPassword} type="password" />
          <Field label="New Password" value={newPassword} onChange={setNewPassword} type="password" />
          <Field label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
        </div>
        <button
          onClick={handleUpdatePassword}
          disabled={updatingPassword || !newPassword || !confirmPassword}
          className="text-xs font-semibold px-5 py-2 rounded-lg text-white transition-all duration-150 hover:brightness-110 disabled:opacity-50"
          style={{ background: "#5D9992" }}
        >
          {updatingPassword ? "Updating…" : "Update Password"}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-border mt-8 pt-6">
        <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider mb-4">
          Danger Zone
        </p>

        <div className="space-y-3">
          {/* Download My Data */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
            <Download className="w-[14px] h-[14px] text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Download My Data</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Export a JSON file containing all your profile, emails, conversations, agent activity, and connected account data. GDPR data portability.
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="text-[10px] font-medium border border-border text-foreground px-3 py-1.5 rounded-md hover:bg-muted/30 transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            >
              {exporting && <Loader2 className="w-3 h-3 animate-spin" />}
              {exporting ? "Exporting…" : "Download JSON"}
            </button>
          </div>

          {/* Clear Data */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
            <Trash2 className="w-[14px] h-[14px] text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Clear All My Data</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Permanently delete all your emails, conversations, agent activity, and connected account data. Your account stays active.
              </p>
            </div>
            <button
              onClick={() => { setDangerMode("data"); setConfirmText(""); }}
              className="text-[10px] font-medium border border-destructive/40 text-destructive px-3 py-1.5 rounded-md hover:bg-destructive/10 transition-colors shrink-0"
            >
              Clear Data
            </button>
          </div>

          {/* Delete Account */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
            <UserX className="w-[14px] h-[14px] text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Delete My Account</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Permanently delete your account and all associated data. This cannot be undone. Your subscription will be cancelled.
              </p>
            </div>
            <button
              onClick={() => { setDangerMode("account"); setConfirmText(""); }}
              className="text-[10px] font-medium border border-destructive/40 text-destructive px-3 py-1.5 rounded-md hover:bg-destructive/10 transition-colors shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {dangerMode && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeDanger}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-base font-bold text-foreground text-center">
              {dangerMode === "account" ? "Delete your account?" : "Clear all your data?"}
            </h3>

            {dangerMode === "data" ? (
              <div className="text-xs text-muted-foreground text-center mt-2 mb-5">
                <p>This will permanently delete:</p>
                <ul className="mt-2 space-y-0.5 text-left inline-block">
                  <li>• All synced emails and drafts</li>
                  <li>• All agent conversations and messages</li>
                  <li>• All pending approvals</li>
                  <li>• All connected email accounts</li>
                </ul>
                <p className="mt-3">Your MythosHQ account stays active.</p>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center mt-2 mb-5">
                <p>This will permanently delete your account and:</p>
                <ul className="mt-2 space-y-0.5 text-left inline-block">
                  <li>• All synced emails and drafts</li>
                  <li>• All agent conversations and messages</li>
                  <li>• All pending approvals</li>
                  <li>• All connected accounts and integrations</li>
                  <li>• Your profile and settings</li>
                </ul>
                <p className="mt-3 text-destructive">
                  Your subscription will be cancelled. This cannot be undone.
                </p>
              </div>
            )}

            <label className="text-xs font-medium text-foreground mb-1 block">
              {dangerMode === "account"
                ? 'Type "DELETE MY ACCOUNT" to confirm'
                : 'Type "DELETE" to confirm'}
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
              disabled={processing}
              className="bg-background border border-border rounded-lg px-3 py-2 text-xs w-full text-foreground focus:outline-none focus:ring-1 focus:ring-destructive/50"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleDangerConfirm}
                disabled={!canConfirm}
                className="bg-destructive text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all flex items-center gap-2"
              >
                {processing && <Loader2 className="w-3 h-3 animate-spin" />}
                {dangerMode === "account" ? "Delete My Account" : "Clear All Data"}
              </button>
              <button
                onClick={closeDanger}
                disabled={processing}
                className="border border-border text-foreground text-xs px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-foreground block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
      />
    </div>
  );
}
