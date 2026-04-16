import { useState } from "react";
import { cn } from "@/lib/utils";

const filterOptions = ["All", "Send Email", "Post Social", "Update CRM"] as const;
type FilterKey = (typeof filterOptions)[number];

const seed = [
  {
    id: "a1",
    agent: "CHIEF",
    actionType: "Send Email",
    summary: "Follow-up to Marcus at Whole Foods re: hot sauce line",
    timestamp: "12 min ago",
    draft:
      "Marcus — wanted to circle back on the hot sauce conversation from last week. We've finalized the small-batch pricing and can have a sample case at your DC by end of next week. Want me to pull the trigger?\n\nHave the best day of your life,\nShane McKnight · Top Hat Provisions",
  },
  {
    id: "a2",
    agent: "CHIEF",
    actionType: "Post Social",
    summary: "LinkedIn post: Top Hat summer BIB launch",
    timestamp: "27 min ago",
    draft:
      "Summer's coming — and so is our new 3-gal BIB lineup, built for bar programs that move volume without sacrificing quality. Reach out if you want to be on the early-access list.",
  },
  {
    id: "a3",
    agent: "ORACLE",
    actionType: "Send Email",
    summary: "Invoice #1042 reminder to Barrel & Oak",
    timestamp: "1 hr ago",
    draft:
      "Hey team at Barrel & Oak — just a friendly heads-up that Invoice #1042 for $840 is now 14 days past due. Let me know if you'd prefer a different payment method.\n\nHave the best day of your life,\nShane McKnight · Top Hat Provisions",
  },
];

export default function AgentsApprovalsPage() {
  const [filter, setFilter] = useState<FilterKey>("All");
  const [showFull, setShowFull] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Record<string, "approved" | "rejected">>({});

  const items = seed.filter((i) =>
    filter === "All" ? true : i.actionType === filter
  );
  const pendingCount = seed.length - Object.keys(resolved).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-foreground">Pending Approvals</h1>
        <span className="bg-destructive/15 text-destructive text-[10px] font-bold px-2 py-0.5 rounded-full">
          {pendingCount}
        </span>
      </div>

      <div className="bg-muted/40 rounded-lg p-0.5 flex gap-0.5 w-fit">
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "transition-colors duration-150",
              filter === f
                ? "bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-semibold"
                : "text-muted-foreground text-xs px-3 py-1.5 hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const status = resolved[item.id];
          const isShowingFull = showFull === item.id;
          return (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary/15 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {item.agent}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {item.actionType}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">{item.timestamp}</span>
              </div>
              <p className="text-sm text-foreground font-medium mt-1">{item.summary}</p>
              <div
                className={cn(
                  "bg-background border border-border rounded-lg p-3 mt-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap",
                  !isShowingFull && "line-clamp-3"
                )}
              >
                {item.draft}
              </div>
              <button
                onClick={() => setShowFull((prev) => (prev === item.id ? null : item.id))}
                className="text-[11px] text-primary hover:underline mt-1.5"
              >
                {isShowingFull ? "Hide draft" : "Show full draft"}
              </button>

              <div className="flex gap-2 mt-3">
                {status === "approved" ? (
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold px-3 py-1.5 rounded-md">
                    ✓ Approved
                  </span>
                ) : status === "rejected" ? (
                  <span className="bg-destructive/10 border border-destructive/30 text-destructive text-[11px] font-semibold px-3 py-1.5 rounded-md">
                    ✗ Rejected
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => setResolved((p) => ({ ...p, [item.id]: "approved" }))}
                      className="bg-[#B54165] text-white text-[11px] font-semibold px-3 py-1.5 rounded-md hover:bg-[#B54165]/90 transition-colors duration-150"
                    >
                      Approve
                    </button>
                    <button className="border border-border text-foreground text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-muted/30 transition-colors duration-150">
                      Edit
                    </button>
                    <button
                      onClick={() => setResolved((p) => ({ ...p, [item.id]: "rejected" }))}
                      className="text-destructive text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-destructive/10 transition-colors duration-150"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
