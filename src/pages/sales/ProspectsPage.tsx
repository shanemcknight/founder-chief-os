import { useState } from "react";
import { Search } from "lucide-react";
import { useCrm } from "@/contexts/CrmContext";
import { toast } from "sonner";

const mockProspects = [
  { biz: "The Interval Bar & Café", loc: "Long Now Foundation, SF", contact: "Maria Santos", title: "Bar Manager", email: "m***@***.org" },
  { biz: "Trick Dog", loc: "Mission District, SF", contact: "Scott Baird", title: "Owner", email: "s***@***.com" },
  { biz: "Smuggler's Cove", loc: "Hayes Valley, SF", contact: "Martin Cate", title: "Owner", email: "m***@***.com" },
];

export default function ProspectsPage() {
  const { createCompany, createContact, setSelectedContactId } = useCrm();
  const [adding, setAdding] = useState<string | null>(null);

  const addToPipeline = async (p: (typeof mockProspects)[number]) => {
    setAdding(p.contact);
    const co = await createCompany({ name: p.biz, location: p.loc });
    const contact = await createContact({
      name: p.contact,
      title: p.title,
      email: p.email,
      company_id: co?.id || null,
      location: p.loc,
      stage: "new_lead",
    });
    setAdding(null);
    if (contact) {
      toast.success(`${p.contact} added to pipeline`);
      setSelectedContactId(contact.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-foreground">Find New Prospects</h1>
        <span className="text-[9px] text-muted-foreground border border-border rounded px-1.5 py-0.5">powered by Apollo</span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          defaultValue="bar owners San Francisco"
          className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          placeholder="Search by city, business type, or keyword..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {mockProspects.map((p) => (
          <div key={p.biz} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs font-semibold text-foreground mb-0.5">{p.biz}</p>
            <p className="text-[10px] text-muted-foreground mb-2">{p.loc}</p>
            <p className="text-[11px] text-foreground">{p.contact}</p>
            <p className="text-[10px] text-muted-foreground mb-1">{p.title}</p>
            <p className="text-[10px] text-muted-foreground font-mono mb-3">{p.email}</p>
            <button
              onClick={() => addToPipeline(p)}
              disabled={adding === p.contact}
              className="w-full text-[11px] font-medium bg-primary text-primary-foreground py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {adding === p.contact ? "Adding..." : "Add to Pipeline"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
