import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, memo } from "react";
import { useLeads, useUpdateLead, STAGES, type Lead } from "@/lib/leads-api";
import { NeuBadge } from "@/components/ui/neu";
import { daysSilent, scoreColor } from "@/lib/signal-score";
import { STAGE_COLOR } from "@/config/plans";
import { useAuth } from "@/hooks/use-auth";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ChevronRight, ChevronLeft, AlertTriangle, GripVertical } from "lucide-react";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorFallback } from "@/components/ui/error-fallback";

export const Route = createFileRoute("/_app/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline | Loopr" },
      { name: "description", content: "Kanban pipeline view with drag-and-drop stage management." },
    ],
  }),
  component: Pipeline,
});

const DEFAULT_META = { bg: "bg-foreground/5", border: "border-foreground/20", dot: "bg-foreground/40", label: "New" };
const STAGE_META: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  New:             { bg: "bg-foreground/5",      border: "border-foreground/20", dot: "bg-foreground/40",    label: "New" },
  Contacted:       { bg: "bg-foreground/5",      border: "border-foreground/20", dot: "bg-foreground/40",    label: "Contacted" },
  Replied:         { bg: "bg-[var(--brand-orange)]/10", border: "border-[var(--brand-orange)]/40", dot: "bg-[var(--brand-orange)]", label: "Replied" },
  "Call Booked":   { bg: "bg-[var(--brand-yellow)]/20", border: "border-[var(--brand-yellow)]",   dot: "bg-[var(--brand-yellow)]", label: "Call Booked" },
  "Proposal Sent": { bg: "bg-[var(--brand-pink)]/10",   border: "border-[var(--brand-pink)]/40",  dot: "bg-[var(--brand-pink)]",   label: "Proposal Sent" },
  Negotiating:     { bg: "bg-[var(--brand-yellow)]/20", border: "border-[var(--brand-yellow)]",   dot: "bg-[var(--brand-yellow)]", label: "Negotiating" },
  Won:             { bg: "bg-[var(--success)]/10",      border: "border-[var(--success)]/40",     dot: "bg-[var(--success)]",      label: "Won" },
  Lost:            { bg: "bg-[var(--destructive)]/10",  border: "border-[var(--destructive)]/40", dot: "bg-[var(--destructive)]",  label: "Lost" },
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function Pipeline() {
  const { data, isLoading, error, refetch } = useLeads();
  const leads = useMemo(() => data?.leads ?? [], [data]);
  const { user } = useAuth();
  const update = useUpdateLead();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [openLead, setOpenLead] = useState<Lead | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ Won: true, Lost: true });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const byStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    STAGES.forEach((s) => (map[s] = []));
    leads.forEach((l: Lead) => { (map[l.stage] ?? map["Contacted"]!).push(l); });
    return map;
  }, [leads]);

  const totalValue = useMemo(
    () => leads.filter((l) => !["Won", "Lost"].includes(l.stage)).reduce((s, l) => s + Number(l.deal_value), 0),
    [leads],
  );

  if (error) return (
    <ErrorFallback
      error={error instanceof Error ? error : new Error(String(error))}
      reset={refetch}
      message="Failed to load pipeline"
    />
  );

  if (isLoading) return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      <div className="px-4 sm:px-6 pt-4 pb-3 shrink-0">
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex gap-3 flex-1 min-h-0 px-4 sm:px-6 pb-6 overflow-x-auto">
        {STAGES.map((stage) => (
          <div key={stage} className="flex-1 min-w-[200px] flex flex-col gap-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ))}
      </div>
    </div>
  );

  const onDragStart = (e: DragStartEvent) => {
    const lead = leads.find((l) => l.id === String(e.active.id));
    if (lead) setActiveLead(lead);
  };
  const onDragEnd = (e: DragEndEvent) => {
    setActiveLead(null);
    if (!e.over) return;
    const id = e.active.id as string;
    const newStage = e.over.id as string;
    const lead = leads.find((l: Lead) => l.id === id);
    if (lead && lead.stage !== newStage) {
      update.mutate({ id, patch: { stage: newStage, stage_changed_at: new Date().toISOString() }, userId: user!.id });
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-2 pb-4 shrink-0 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {leads.filter((l) => !["Won", "Lost"].includes(l.stage)).length} active leads ·{" "}
            <span className="font-bold text-foreground">${totalValue.toLocaleString()}</span> pipeline value
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-[var(--success)] inline-block" /> Won
          <span className="w-2 h-2 rounded-full bg-[var(--destructive)] inline-block ml-2" /> Lost
        </div>
      </div>

      {/* Board */}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 flex-1 min-h-0 px-4 sm:px-6 pb-6 overflow-x-auto no-scrollbar">
          {STAGES.map((stage) => {
            const items = byStage[stage] || [];
            const value = items.reduce((s, l) => s + Number(l.deal_value), 0);
            const isCollapsible = stage === "Won" || stage === "Lost";
            const isCollapsed = isCollapsible && collapsed[stage];
            const meta = STAGE_META[stage] ?? DEFAULT_META;

            return (
              <KanbanColumn key={stage} stage={stage} isOver={false}>
                {isCollapsed ? (
                  /* Collapsed pill */
                  <button
                    onClick={() => setCollapsed({ ...collapsed, [stage]: false })}
                    className={`h-full w-12 rounded-2xl border-2 ${meta.border} ${meta.bg} flex flex-col items-center justify-center gap-2 transition-all hover:w-14 group shrink-0`}
                    style={{ boxShadow: "0 4px 0 #0a0a0a" }}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${meta.dot} border-2 border-black`} />
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-foreground/60 [writing-mode:vertical-rl] rotate-180">
                      {stage}
                    </span>
                    <span className="text-[10px] font-extrabold text-foreground/50">{items.length}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ) : (
                  /* Expanded column */
                  <div
                    className={`flex flex-col h-full rounded-2xl border-2 ${meta.border} overflow-hidden transition-all`}
                    style={{ minWidth: 200, width: 220, flex: "0 0 220px", boxShadow: "0 4px 0 #0a0a0a", background: "var(--card)" }}
                  >
                    {/* Column header */}
                    <div className={`${meta.bg} px-3 py-2.5 border-b-2 ${meta.border} shrink-0`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${meta.dot} border-2 border-black shrink-0`} />
                          <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                            {stage}
                          </span>
                          <span className="bg-black/10 text-foreground text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-black/10">
                            {items.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            ${value.toLocaleString()}
                          </span>
                          {isCollapsible && (
                            <button
                              onClick={() => setCollapsed({ ...collapsed, [stage]: true })}
                              className="p-0.5 rounded hover:bg-black/10 transition-colors"
                            >
                              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-2.5 space-y-2">
                      {items.map((l) => (
                        <KanbanCard key={l.id} lead={l} onClick={() => setOpenLead(l)} />
                      ))}
                      {items.length === 0 && (
                        <div className="h-full min-h-[80px] rounded-xl border-2 border-dashed border-foreground/15 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground/50 font-semibold">Drop here</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="rotate-2 scale-105 opacity-95 pointer-events-none">
              <KanbanCard lead={activeLead} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {openLead && <LeadDrawer lead={openLead} onClose={() => setOpenLead(null)} />}
    </div>
  );
}

function KanbanColumn({
  stage,
  children,
}: {
  stage: string;
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`flex h-full transition-transform duration-150 ${isOver ? "scale-[1.01]" : ""}`}
    >
      {children}
    </div>
  );
}

const AVATAR_COLORS = [
  "bg-[var(--brand-orange)] text-white",
  "bg-[var(--brand-pink)] text-white",
  "bg-[var(--success)] text-black",
  "bg-[var(--brand-yellow)] text-black",
  "bg-foreground text-background",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const KanbanCard = memo(function KanbanCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  const ds = daysSilent(lead.last_contact);
  const sc = scoreColor(lead.signal_score);
  const atRisk = ds !== null && ds >= 5 && !["Won", "Lost"].includes(lead.stage);
  const scoreBarWidth = Math.min(100, Math.max(0, lead.signal_score));
  const scoreBarColor = sc === "green" ? "var(--success)" : sc === "amber" ? "var(--brand-yellow)" : "var(--destructive)";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onClick={onClick}
      className={`group relative bg-white rounded-xl border-2 border-black p-3 cursor-pointer select-none transition-all duration-150
        ${isDragging ? "opacity-40 scale-95" : "hover:-translate-y-0.5"}
        ${atRisk ? "border-destructive shadow-[0_4px_0_var(--destructive)]" : "shadow-[0_4px_0_#0a0a0a]"}
      `}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5 text-foreground" />
      </div>

      {/* Top row: avatar + name */}
      <div className="flex items-start gap-2.5 pr-4">
        <div className={`w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center text-[10px] font-extrabold shrink-0 ${avatarColor(lead.name)}`}>
          {initials(lead.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-foreground truncate leading-tight">{lead.name}</div>
          {lead.company && (
            <div className="text-[10px] text-muted-foreground truncate mt-0.5">{lead.company}</div>
          )}
        </div>
      </div>

      {/* Deal value */}
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-sm font-extrabold text-foreground">
          ${Number(lead.deal_value).toLocaleString()}
        </span>
        {atRisk && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {ds}d silent
          </span>
        )}
        {!atRisk && ds !== null && (
          <span className="text-[10px] text-muted-foreground">{ds}d ago</span>
        )}
      </div>

      {/* Signal score bar */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Signal</span>
          <span className="text-[10px] font-extrabold" style={{ color: scoreBarColor }}>{lead.signal_score}</span>
        </div>
        <div className="h-1.5 rounded-full bg-foreground/10 border border-black/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${scoreBarWidth}%`, background: scoreBarColor }}
          />
        </div>
      </div>
    </div>
  );
});
