import { useState, useMemo } from "react";
import { Building2, Plus } from "lucide-react";
import { useCrm } from "@/contexts/CrmContext";

export default function CompaniesPage() {
  const { companies, contacts, loading, createCompany, setSelectedContactId } = useCrm();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const stats = useMemo(() => {
    const map = new Map<string, { count: number; pipeline: number }>();
    contacts.forEach((c) => {
      if (!c.company_id) return;
      const cur = map.get(c.company_id) || { count: 0, pipeline: 0 };
      cur.count++;
      cur.pipeline += Number(c.value) || 0;
      map.set(c.company_id, cur);
    });
    return map;
  }, [contacts]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCompany({ name: newName.trim(), industry: newIndustry.trim() || null });
    setNewName("");
    setNewIndustry("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Companies</h1>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Add Company
        </button>
      </div>

      {showAdd && (
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Company name"
            className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
          />
          <input
            value={newIndustry}
            onChange={(e) => setNewIndustry(e.target.value)}
            placeholder="Industry"
            className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
          />
          <button onClick={handleCreate} className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
            Create
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : companies.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-xs text-muted-foreground">No companies yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {companies.map((co) => {
            const s = stats.get(co.id) || { count: 0, pipeline: 0 };
            const isOpen = expanded === co.id;
            return (
              <div key={co.id} className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                <button onClick={() => setExpanded(isOpen ? null : co.id)} className="w-full text-left">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{co.name}</p>
                      {co.industry && <p className="text-[10px] text-muted-foreground truncate">{co.industry}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground">{s.count} contact{s.count !== 1 ? "s" : ""}</span>
                    <span className="text-[11px] font-medium text-warning">${s.pipeline}/mo</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                    {contacts.filter((c) => c.company_id === co.id).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedContactId(c.id)}
                        className="block w-full text-left text-[11px] text-foreground hover:text-primary transition-colors"
                      >
                        {c.name} {c.title && <span className="text-muted-foreground">— {c.title}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
