import { useState } from "react";
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

export default function AccountSettings() {
  const { user, profile } = useAuth();

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

  const [deleteText, setDeleteText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      <div className="border border-destructive/50 rounded-xl p-5">
        <h3 className="text-sm font-bold text-destructive mb-2">Danger Zone</h3>
        <p className="text-xs text-muted-foreground mb-4">
          This permanently deletes your account and all data. This cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            Delete My Account
          </button>
        ) : (
          <div className="space-y-3 max-w-sm">
            <p className="text-xs text-foreground">
              Type <span className="font-bold text-destructive">DELETE</span> to confirm:
            </p>
            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-background border border-destructive/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-destructive/50"
            />
            <div className="flex gap-2">
              <button
                disabled={deleteText !== "DELETE"}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-40"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
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
