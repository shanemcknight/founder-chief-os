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
  Github, HardDrive,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
}

const DEFAULT_TOOLS: ConnectedTool[] = [
  { id: "1", name: "Shopify", icon: "store", color: "#96bf48", link: "https://admin.shopify.com/store/top-hat-provisions", connected: true },
  { id: "2", name: "ShipStation", icon: "package", color: "#f47521", link: "https://ship9.shipstation.com/orders/awaiting-shipment", connected: true },
  { id: "3", name: "Klaviyo", icon: "mail", color: "#000000", link: "https://www.klaviyo.com/dashboard", connected: true },
  { id: "4", name: "Amazon", icon: "shopping-cart", color: "#ff9900", link: "https://sellercentral.amazon.com/home", connected: true },
  { id: "5", name: "QuickBooks", icon: "calculator", color: "#2ca01c", link: "https://qbo.intuit.com/app/get-things-done", connected: true },
  { id: "6", name: "Google Analytics", icon: "bar-chart-3", color: "#E37400", link: "https://analytics.google.com/analytics/web/#/a333250985p463383844/reports/intelligenthome", connected: true },
  { id: "7", name: "Google Ads", icon: "trending-up", color: "#4285F4", link: "https://ads.google.com/aw/overview?ocid=135365598", connected: true },
  { id: "8", name: "Dropbox", icon: "folder", color: "#0061FF", link: "https://www.dropbox.com/home", connected: true },
  { id: "9", name: "Google Drive", icon: "hard-drive", color: "#4285F4", link: "https://drive.google.com/drive/home", connected: true },
  { id: "10", name: "Supabase", icon: "database", color: "#3ECF8E", link: "https://supabase.com/dashboard/organizations", connected: true },
  { id: "11", name: "Github", icon: "github", color: "#333333", link: "https://github.com/", connected: true },
];

const STORAGE_KEY = "connectedTools";

function loadTools(): ConnectedTool[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
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
  const [form, setForm] = useState({ name: "", icon: "globe", color: "#00B1E8", link: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => { saveTools(tools); }, [tools]);

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
    const newTool: ConnectedTool = { id: crypto.randomUUID(), name: form.name.trim(), icon: form.icon, color: form.color, link: form.link.trim(), connected: true };
    setTools(prev => [...prev, newTool]);
    setAddOpen(false);
    setForm({ name: "", icon: "globe", color: "#00B1E8", link: "" });
    setFormErrors({});
    toast({ title: "Tool added", description: `${newTool.name} has been connected.` });
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
    const name = tools.find(t => t.id === deleteId)?.name;
    setTools(prev => prev.filter(t => t.id !== deleteId));
    setDeleteId(null);
    setEditingId(null);
    setFormErrors({});
    toast({ title: "Tool removed", description: `${name} has been disconnected.`, variant: "destructive" });
  };

  const startEdit = (tool: ConnectedTool, e: React.MouseEvent) => {
    e.stopPropagation();
    setForm({ name: tool.name, icon: tool.icon, color: tool.color, link: tool.link });
    setEditingId(tool.id);
    setFormErrors({});
  };

  const cancelEdit = () => { setEditingId(null); setFormErrors({}); };

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
        {tools.map(tool => {
          const Icon = ICON_MAP[tool.icon] || Globe;
          return (
            <div key={tool.id}
              onClick={() => window.open(tool.link, "_blank")}
              className="group relative bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors duration-150 flex flex-col items-center text-center">
              <button onClick={(e) => startEdit(tool, e)}
                className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all duration-150">
                <Pencil size={13} className="text-muted-foreground" />
              </button>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: tool.color }}>
                <Icon size={28} className="text-white" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{tool.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-[11px] text-muted-foreground">Connected</span>
              </div>
              <ExternalLink size={11} className="absolute bottom-2 right-2 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
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
