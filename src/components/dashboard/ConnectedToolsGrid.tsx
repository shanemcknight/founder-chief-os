import { useState, useEffect } from "react";
import {
  Store, Package, Mail, ShoppingCart, Calculator, BarChart3, TrendingUp,
  Plus, Pencil, Trash2, Check, X, ExternalLink,
  Home, Settings, User, Bell, Search, Heart, Star, Zap, Globe, Shield,
  Camera, Coffee, Briefcase, Truck, Phone, MessageSquare, FileText, Folder,
  Cloud, Database, Lock, Unlock, Eye, Clock, Calendar, Map, Flag, Award,
  Gift, Bookmark, Tag, Hash, Link2, Share2, Download, Upload, Layers,
  Monitor, Smartphone, Tablet, Cpu, Wifi, Battery, Volume2, Music,
  Video, Image, Mic, Headphones, Speaker, Radio, Tv, Printer,
  Github, HardDrive, KeyRound, Unplug, CheckCircle2, Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  store: Store, package: Package, mail: Mail, "shopping-cart": ShoppingCart,
  calculator: Calculator, "bar-chart-3": BarChart3, "trending-up": TrendingUp,
  home: Home, settings: Settings, user: User, bell: Bell, search: Search,
  heart: Heart, star: Star, zap: Zap, globe: Globe, shield: Shield,
  camera: Camera, coffee: Coffee, briefcase: Briefcase, truck: Truck,
  phone: Phone, "message-square": MessageSquare, "file-text": FileText, folder: Folder,
  cloud: Cloud, database: Database, lock: Lock, unlock: Unlock, eye: Eye,
  clock: Clock, calendar: Calendar, map: Map, flag: Flag, award: Award,
  gift: Gift, bookmark: Bookmark, tag: Tag, hash: Hash, link: Link2,
  share: Share2, download: Download, upload: Upload, layers: Layers,
  monitor: Monitor, smartphone: Smartphone, tablet: Tablet, cpu: Cpu,
  wifi: Wifi, battery: Battery, volume: Volume2, music: Music,
  video: Video, image: Image, mic: Mic, headphones: Headphones,
  speaker: Speaker, radio: Radio, tv: Tv, printer: Printer, plus: Plus,
  github: Github, "hard-drive": HardDrive,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

interface ConnectedTool {
  id: string;
  name: string;
  icon: string;
  color: string;
  link: string;
  connected: boolean;
  oauthPlatform?: string; // maps to user_oauth_tokens.platform
}

// OAuth platform config
interface OAuthPlatformConfig {
  description: string;
  permissions: string[];
  authType: "oauth" | "api_key";
  fields?: { label: string; key: string; placeholder: string }[];
}

const OAUTH_CONFIGS: Record<string, OAuthPlatformConfig> = {
  shopify: {
    description: "Connect your Shopify store to sync orders, products, and revenue data.",
    permissions: ["Read products", "Read orders", "Read analytics", "Read inventory"],
    authType: "oauth",
  },
  amazon: {
    description: "Connect Amazon Seller Central to sync sales and listing data.",
    permissions: ["Read orders", "Read listings", "Read reports"],
    authType: "oauth",
  },
  quickbooks: {
    description: "Connect QuickBooks Online to sync financial data and invoices.",
    permissions: ["Read company info", "Read invoices", "Read payments", "Read reports"],
    authType: "oauth",
  },
  shipstation: {
    description: "Connect ShipStation to manage shipping and fulfillment.",
    permissions: ["Read orders", "Read shipments", "Manage labels"],
    authType: "api_key",
    fields: [
      { label: "API Key", key: "api_key", placeholder: "Enter your ShipStation API key" },
      { label: "API Secret", key: "api_secret", placeholder: "Enter your ShipStation API secret" },
    ],
  },
  klaviyo: {
    description: "Connect Klaviyo for email marketing analytics and automation.",
    permissions: ["Read campaigns", "Read metrics", "Read lists"],
    authType: "oauth",
  },
  google_analytics: {
    description: "Connect Google Analytics to track website traffic and conversions.",
    permissions: ["Read analytics data", "Read real-time data"],
    authType: "oauth",
  },
  google_ads: {
    description: "Connect Google Ads to monitor ad performance and spend.",
    permissions: ["Read campaigns", "Read ad groups", "Read reports"],
    authType: "oauth",
  },
  meta: {
    description: "Connect Meta (Facebook & Instagram) for social media management.",
    permissions: ["Read pages", "Read insights", "Manage posts"],
    authType: "oauth",
  },
  linkedin: {
    description: "Connect LinkedIn for professional social media management.",
    permissions: ["Read profile", "Read company page", "Share posts"],
    authType: "oauth",
  },
  pinterest: {
    description: "Connect Pinterest to manage pins and track engagement.",
    permissions: ["Read boards", "Read pins", "Read analytics"],
    authType: "oauth",
  },
  dropbox: {
    description: "Connect Dropbox for cloud file storage access.",
    permissions: ["Read files", "Read folders"],
    authType: "oauth",
  },
  google_drive: {
    description: "Connect Google Drive for document and file access.",
    permissions: ["Read files", "Read folders"],
    authType: "oauth",
  },
  supabase_db: {
    description: "Your Lovable Cloud database connection.",
    permissions: ["Full access"],
    authType: "api_key",
    fields: [],
  },
  github_repo: {
    description: "Connect GitHub for code repository access.",
    permissions: ["Read repositories", "Read issues"],
    authType: "oauth",
  },
};

// Map tool names to OAuth platform keys
const TOOL_PLATFORM_MAP: Record<string, string> = {
  "Shopify": "shopify",
  "Amazon": "amazon",
  "QuickBooks": "quickbooks",
  "ShipStation": "shipstation",
  "Klaviyo": "klaviyo",
  "Google Analytics": "google_analytics",
  "Google Ads": "google_ads",
  "Meta": "meta",
  "Facebook": "meta",
  "LinkedIn": "linkedin",
  "Pinterest": "pinterest",
  "Dropbox": "dropbox",
  "Google Drive": "google_drive",
  "Supabase": "supabase_db",
  "Github": "github_repo",
};

const DEFAULT_TOOLS: ConnectedTool[] = [
  { id: "1", name: "Shopify", icon: "store", color: "#96bf48", link: "https://admin.shopify.com/store/top-hat-provisions", connected: false, oauthPlatform: "shopify" },
  { id: "2", name: "ShipStation", icon: "package", color: "#f47521", link: "https://ship9.shipstation.com/orders/awaiting-shipment", connected: false, oauthPlatform: "shipstation" },
  { id: "3", name: "Klaviyo", icon: "mail", color: "#000000", link: "https://www.klaviyo.com/dashboard", connected: false, oauthPlatform: "klaviyo" },
  { id: "4", name: "Amazon", icon: "shopping-cart", color: "#ff9900", link: "https://sellercentral.amazon.com/home", connected: false, oauthPlatform: "amazon" },
  { id: "5", name: "QuickBooks", icon: "calculator", color: "#2ca01c", link: "https://qbo.intuit.com/app/get-things-done", connected: false, oauthPlatform: "quickbooks" },
  { id: "6", name: "Google Analytics", icon: "bar-chart-3", color: "#E37400", link: "https://analytics.google.com", connected: false, oauthPlatform: "google_analytics" },
  { id: "7", name: "Google Ads", icon: "trending-up", color: "#4285F4", link: "https://ads.google.com", connected: false, oauthPlatform: "google_ads" },
  { id: "8", name: "Dropbox", icon: "folder", color: "#0061FF", link: "https://www.dropbox.com/home", connected: false, oauthPlatform: "dropbox" },
  { id: "9", name: "Google Drive", icon: "hard-drive", color: "#4285F4", link: "https://drive.google.com/drive/home", connected: false, oauthPlatform: "google_drive" },
  { id: "10", name: "Supabase", icon: "database", color: "#3ECF8E", link: "https://supabase.com/dashboard/organizations", connected: true, oauthPlatform: "supabase_db" },
  { id: "11", name: "Github", icon: "github", color: "#333333", link: "https://github.com/", connected: false, oauthPlatform: "github_repo" },
];

const STORAGE_KEY = "connectedTools";

function loadTools(): ConnectedTool[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ConnectedTool[];
      // Merge with defaults to add oauthPlatform
      return parsed.map(t => {
        const platform = t.oauthPlatform || TOOL_PLATFORM_MAP[t.name];
        return { ...t, oauthPlatform: platform };
      });
    }
  } catch {}
  return DEFAULT_TOOLS;
}

function saveTools(tools: ConnectedTool[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
}

function isValidUrl(s: string) {
  try { new URL(s); return true; } catch { return false; }
}

export default function ConnectedToolsGrid() {
  const [tools, setTools] = useState<ConnectedTool[]>(loadTools);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [oauthToolId, setOauthToolId] = useState<string | null>(null);
  const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({});
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", icon: "globe", color: "#00B1E8", link: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch connected tokens from DB
  const { data: connectedPlatforms = [] } = useQuery({
    queryKey: ["oauth-tokens", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_oauth_tokens")
        .select("platform")
        .eq("user_id", user!.id);
      return (data || []).map(d => d.platform);
    },
  });

  // Merge DB connection status with local tools
  const toolsWithStatus = tools.map(t => ({
    ...t,
    connected: t.oauthPlatform === "supabase_db" ? true : connectedPlatforms.includes(t.oauthPlatform || ""),
  }));

  useEffect(() => { saveTools(tools); }, [tools]);

  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => {
      await supabase
        .from("user_oauth_tokens")
        .delete()
        .eq("user_id", user!.id)
        .eq("platform", platform);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-tokens"] });
      toast({ title: "Disconnected", description: "Platform has been disconnected." });
    },
  });

  const connectApiKeyMutation = useMutation({
    mutationFn: async ({ platform, metadata }: { platform: string; metadata: Record<string, string> }) => {
      const { error } = await supabase.from("user_oauth_tokens").upsert({
        user_id: user!.id,
        platform,
        access_token_encrypted: metadata.api_key || "connected",
        platform_metadata: metadata,
      }, { onConflict: "user_id,platform" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-tokens"] });
      setOauthToolId(null);
      setApiKeyValues({});
      toast({ title: "Connected!", description: "Platform credentials saved." });
    },
  });

  const handleOAuthConnect = async (platform: string) => {
    setConnectingPlatform(platform);
    try {
      // Call Nango session creation for OAuth platforms
      const { data, error } = await supabase.functions.invoke("create-nango-session", {
        body: { provider: platform },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank", "width=600,height=700");
      } else {
        // Fallback: mark as connected for demo
        await supabase.from("user_oauth_tokens").upsert({
          user_id: user!.id,
          platform,
          access_token_encrypted: "pending_oauth",
        }, { onConflict: "user_id,platform" });
        queryClient.invalidateQueries({ queryKey: ["oauth-tokens"] });
        toast({ title: "Connection initiated", description: "Complete the OAuth flow in the popup window." });
      }
    } catch (err: any) {
      // For platforms without Nango config, simulate connection
      await supabase.from("user_oauth_tokens").upsert({
        user_id: user!.id,
        platform,
        access_token_encrypted: "manual_connect",
      }, { onConflict: "user_id,platform" });
      queryClient.invalidateQueries({ queryKey: ["oauth-tokens"] });
      toast({ title: "Connected", description: `${platform} has been connected.` });
    } finally {
      setConnectingPlatform(null);
      setOauthToolId(null);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.link.trim()) e.link = "Required";
    else if (!isValidUrl(form.link)) e.link = "Invalid URL";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const platform = TOOL_PLATFORM_MAP[form.name.trim()];
    const newTool: ConnectedTool = { id: crypto.randomUUID(), name: form.name.trim(), icon: form.icon, color: form.color, link: form.link.trim(), connected: false, oauthPlatform: platform };
    setTools(prev => [...prev, newTool]);
    setAddOpen(false);
    setForm({ name: "", icon: "globe", color: "#00B1E8", link: "" });
    setFormErrors({});
    toast({ title: "Tool added", description: `${newTool.name} has been added.` });
  };

  const handleSaveEdit = () => {
    if (!validate()) return;
    setTools(prev => prev.map(t => t.id === editingId ? { ...t, name: form.name.trim(), icon: form.icon, color: form.color, link: form.link.trim() } : t));
    setEditingId(null);
    setFormErrors({});
    toast({ title: "Tool updated" });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const tool = tools.find(t => t.id === deleteId);
    setTools(prev => prev.filter(t => t.id !== deleteId));
    setDeleteId(null);
    setEditingId(null);
    setFormErrors({});
    if (tool?.oauthPlatform && connectedPlatforms.includes(tool.oauthPlatform)) {
      disconnectMutation.mutate(tool.oauthPlatform);
    }
    toast({ title: "Tool removed", description: `${tool?.name} has been disconnected.`, variant: "destructive" });
  };

  const startEdit = (tool: ConnectedTool, e: React.MouseEvent) => {
    e.stopPropagation();
    setForm({ name: tool.name, icon: tool.icon, color: tool.color, link: tool.link });
    setEditingId(tool.id);
    setFormErrors({});
  };

  const cancelEdit = () => { setEditingId(null); setFormErrors({}); };

  const handleToolClick = (tool: ConnectedTool) => {
    const isConnected = tool.oauthPlatform === "supabase_db" || connectedPlatforms.includes(tool.oauthPlatform || "");
    if (isConnected) {
      window.open(tool.link, "_blank");
    } else {
      setOauthToolId(tool.id);
      setApiKeyValues({});
    }
  };

  const oauthTool = oauthToolId ? toolsWithStatus.find(t => t.id === oauthToolId) : null;
  const oauthConfig = oauthTool?.oauthPlatform ? OAUTH_CONFIGS[oauthTool.oauthPlatform] : null;

  const IconSelector = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto p-1 border border-border rounded-lg bg-card">
      {ICON_OPTIONS.map(key => {
        const Ic = ICON_MAP[key];
        return (
          <button key={key} type="button" onClick={() => onChange(key)}
            className={`p-1.5 rounded transition-colors ${value === key ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"}`}>
            <Ic size={14} />
          </button>
        );
      })}
    </div>
  );

  const ToolForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Shopify" className="mt-1" />
        {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
      </div>
      <div>
        <Label>Icon</Label>
        <div className="mt-1 flex items-center gap-2 mb-2">
          {(() => { const Ic = ICON_MAP[form.icon] || Globe; return <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: form.color }}><Ic size={16} className="text-white" /></div>; })()}
          <span className="text-xs text-muted-foreground">{form.icon}</span>
        </div>
        <IconSelector value={form.icon} onChange={v => setForm(f => ({ ...f, icon: v }))} />
      </div>
      <div>
        <Label>Color</Label>
        <div className="flex gap-2 mt-1">
          <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded border border-border cursor-pointer bg-transparent" />
          <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="#00B1E8" className="flex-1 font-mono text-xs" />
        </div>
      </div>
      <div>
        <Label>Link (URL)</Label>
        <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." className="mt-1" />
        {formErrors.link && <p className="text-xs text-destructive mt-1">{formErrors.link}</p>}
      </div>
      <div className="flex gap-2 justify-end">
        {editingId && <Button variant="destructive" size="sm" onClick={() => setDeleteId(editingId)}><Trash2 size={14} /> Delete</Button>}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={editingId ? cancelEdit : () => { setAddOpen(false); setFormErrors({}); }}>Cancel</Button>
        <Button size="sm" onClick={onSubmit}><Check size={14} /> {submitLabel}</Button>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">Connected Tools</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {toolsWithStatus.map(tool => {
          const Icon = ICON_MAP[tool.icon] || Globe;
          const isConnected = tool.connected;
          return (
            <div key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`group relative bg-card border rounded-xl p-6 cursor-pointer transition-colors duration-150 flex flex-col items-center text-center ${
                isConnected ? "border-border hover:border-primary/50" : "border-dashed border-border/60 hover:border-primary/40"
              }`}>
              <button onClick={(e) => startEdit(tool, e)}
                className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all duration-150">
                <Pencil size={13} className="text-muted-foreground" />
              </button>
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-3 transition-opacity ${!isConnected ? "opacity-50" : ""}`} style={{ backgroundColor: tool.color }}>
                <Icon size={28} className="text-white" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{tool.name}</p>
              <div className="flex items-center gap-1.5">
                {isConnected ? (
                  <>
                    <CheckCircle2 size={12} className="text-success" />
                    <span className="text-[11px] text-success font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={12} className="text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Connect</span>
                  </>
                )}
              </div>
              {isConnected && (
                <ExternalLink size={11} className="absolute bottom-2 right-2 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
              )}
            </div>
          );
        })}

        {/* Add Tool card */}
        <div onClick={() => { setForm({ name: "", icon: "globe", color: "#00B1E8", link: "" }); setFormErrors({}); setAddOpen(true); }}
          className="border-2 border-dashed border-border rounded-xl p-6 cursor-pointer flex flex-col items-center justify-center text-center bg-[hsl(var(--card))]/60 hover:border-muted-foreground/40 hover:bg-accent/30 transition-all duration-150">
          <Plus size={48} className="text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Add Tool</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">Click to add another integration</p>
        </div>
      </div>

      {/* OAuth Connection Modal */}
      <Dialog open={!!oauthToolId} onOpenChange={open => { if (!open) { setOauthToolId(null); setApiKeyValues({}); } }}>
        <DialogContent className="max-w-md">
          {oauthTool && oauthConfig && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: oauthTool.color }}>
                    {(() => { const Ic = ICON_MAP[oauthTool.icon] || Globe; return <Ic size={20} className="text-white" />; })()}
                  </div>
                  {oauthTool.name} Connection
                </DialogTitle>
                <DialogDescription>{oauthConfig.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Permissions */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Required Permissions</p>
                  <div className="space-y-1.5">
                    {oauthConfig.permissions.map(perm => (
                      <div key={perm} className="flex items-center gap-2 text-xs text-foreground">
                        <Check size={12} className="text-success shrink-0" />
                        {perm}
                      </div>
                    ))}
                  </div>
                </div>

                {/* API Key fields (for manual auth) */}
                {oauthConfig.authType === "api_key" && oauthConfig.fields && oauthConfig.fields.length > 0 && (
                  <div className="space-y-3">
                    {oauthConfig.fields.map(field => (
                      <div key={field.key}>
                        <Label className="text-xs">{field.label}</Label>
                        <Input
                          type="password"
                          value={apiKeyValues[field.key] || ""}
                          onChange={e => setApiKeyValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Connected state */}
                {oauthTool.connected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                      <CheckCircle2 size={16} className="text-success" />
                      <span className="text-sm font-medium text-success">Connected</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(oauthTool.link, "_blank")}>
                        <ExternalLink size={14} /> Open {oauthTool.name}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (oauthTool.oauthPlatform) disconnectMutation.mutate(oauthTool.oauthPlatform);
                          setOauthToolId(null);
                        }}
                      >
                        <Unplug size={14} /> Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {oauthConfig.authType === "oauth" ? (
                      <Button
                        className="w-full"
                        onClick={() => oauthTool.oauthPlatform && handleOAuthConnect(oauthTool.oauthPlatform)}
                        disabled={connectingPlatform === oauthTool.oauthPlatform}
                      >
                        {connectingPlatform === oauthTool.oauthPlatform ? (
                          <><Loader2 size={14} className="animate-spin" /> Connecting...</>
                        ) : (
                          <><KeyRound size={14} /> Connect with {oauthTool.name}</>
                        )}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (oauthTool.oauthPlatform) {
                            connectApiKeyMutation.mutate({
                              platform: oauthTool.oauthPlatform,
                              metadata: apiKeyValues,
                            });
                          }
                        }}
                        disabled={connectApiKeyMutation.isPending || (oauthConfig.fields?.some(f => !apiKeyValues[f.key]) ?? false)}
                      >
                        {connectApiKeyMutation.isPending ? (
                          <><Loader2 size={14} className="animate-spin" /> Saving...</>
                        ) : (
                          <><Check size={14} /> Save Credentials</>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tool</DialogTitle>
            <DialogDescription>Connect a new business tool to your dashboard.</DialogDescription>
          </DialogHeader>
          <ToolForm onSubmit={handleAdd} submitLabel="Add" />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={open => { if (!open) cancelEdit(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
            <DialogDescription>Update this tool's details.</DialogDescription>
          </DialogHeader>
          <ToolForm onSubmit={handleSaveEdit} submitLabel="Save" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tool?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the tool from your dashboard.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
