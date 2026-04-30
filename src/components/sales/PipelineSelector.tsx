import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCrm, PIPELINE_COLORS } from "@/contexts/CrmContext";
import { cn } from "@/lib/utils";

function colorDot(color: string) {
  return PIPELINE_COLORS.find((c) => c.key === color)?.className || "bg-primary";
}

type Props = {
  /** Show "All Pipelines" option. Default true. Pipeline page sets false. */
  allowAll?: boolean;
};

/**
 * Unified pipeline selector used across all SALES sub-pages.
 * Reads/writes activePipelineId on CrmContext (sessionStorage-backed).
 */
export default function PipelineSelector({ allowAll = true }: Props) {
  const { pipelines, contacts, activePipelineId, setActivePipelineId } = useCrm();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const active = pipelines.find((p) => p.id === activePipelineId) || null;
  const totalCount = contacts.length;
  const countFor = (pid: string) => contacts.filter((c) => c.pipeline_id === pid).length;

  if (pipelines.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 text-xs bg-card border border-border rounded-md hover:border-primary/50 transition-colors min-w-[200px]"
      >
        {active ? (
          <>
            <span className={cn("w-2 h-2 rounded-full", colorDot(active.color))} />
            <span className="font-semibold text-foreground">{active.name}</span>
            <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {countFor(active.id)}
            </span>
          </>
        ) : (
          <>
            <span className="font-semibold text-foreground">All Pipelines</span>
            <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {totalCount}
            </span>
          </>
        )}
        <ChevronDown size={12} className="ml-auto text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[240px] max-h-[320px] overflow-y-auto">
          {allowAll && (
            <button
              onClick={() => {
                setActivePipelineId(null);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted",
                activePipelineId === null ? "text-primary font-semibold bg-primary/5" : "text-foreground"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-muted-foreground/60" />
              <span className="flex-1 truncate">All Pipelines</span>
              <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{totalCount}</span>
            </button>
          )}
          {pipelines.map((p) => {
            const isActive = p.id === activePipelineId;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setActivePipelineId(p.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted",
                  isActive ? "text-primary font-semibold bg-primary/5" : "text-foreground"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", colorDot(p.color))} />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{countFor(p.id)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
