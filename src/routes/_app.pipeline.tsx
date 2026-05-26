import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, memo, useRef } from "react";
import { useLeads, useUpdateLead, STAGES, type Lead } from "@/lib/leads-api";
import { NeuCard, NeuBadge } from "@/components/ui/neu";
import { daysSilent, scoreColor } from "@/lib/signal-score";
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
import { ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline  Loopr" },
      {
        name: "description",
        content: "Kanban pipeline view with drag-and-drop stage management for your CRM leads.",
      },
    ],
  }),
  component: Pipeline,
});

function Pipeline() {
  const { data, isLoading } = useLeads();
  const leads = data?.leads ?? [];
  const update = useUpdateLead();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [openLead, setOpenLead] = useState<Lead | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ Won: true, Lost: true });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const byStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    STAGES.forEach((s) => (map[s] = []));
    leads.forEach((l: Lead) => {
      (map[l.stage] ?? map["Contacted"]!).push(l);
    });
    return map;
  }, [leads]);

  if (isLoading) {
    return (
      <div className="max-w-full mx-auto space-y-5 p-6">
        <div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage} className="shrink-0 w-[300px]">
              <div className="neu-raised rounded-2xl p-3">
                <Skeleton className="h-5 w-20 mb-3" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="neu-raised-sm rounded-xl p-3">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
      update.mutate({ id, patch: { stage: newStage, stage_changed_at: new Date().toISOString() } });
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Drag cards between stages.</p>
      </header>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="relative group/scroll">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin"
          >
            {STAGES.map((stage) => {
              const items = byStage[stage] || [];
              const value = items.reduce((s, l) => s + Number(l.deal_value), 0);
              const isCollapsible = stage === "Won" || stage === "Lost";
              const isCollapsed = isCollapsible && collapsed[stage];
              return (
                <KanbanColumn key={stage} stage={stage}>
                  <div
                    className={`shrink-0 ${isCollapsed ? "w-[80px]" : "w-[300px]"} transition-all duration-200`}
                  >
                    <div className="neu-raised rounded-2xl p-3 h-full">
                      <button
                        onClick={() =>
                          isCollapsible && setCollapsed({ ...collapsed, [stage]: !isCollapsed })
                        }
                        className="w-full flex items-center justify-between px-2 py-1 mb-3"
                      >
                        <div className="flex items-center gap-1.5">
                          {isCollapsible &&
                            (isCollapsed ? (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            ))}
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                            {isCollapsed ? stage[0] : stage}
                          </span>
                        </div>
                        {!isCollapsed && (
                          <div className="flex items-center gap-2">
                            <span className="bg-foreground/10 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                              {items.length}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ${value.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </button>
                      {!isCollapsed && (
                        <div className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                          {items.map((l) => (
                            <KanbanCard key={l.id} lead={l} onClick={() => setOpenLead(l)} />
                          ))}
                          {items.length === 0 && (
                            <div className="neu-inset-sm rounded-xl py-8 text-center text-xs text-muted-foreground">
                              Drop here
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </KanbanColumn>
              );
            })}
          </div>
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 opacity-0 group-hover/scroll:opacity-100 transition-opacity z-10 neu-pressable rounded-xl p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 opacity-0 group-hover/scroll:opacity-100 transition-opacity z-10 neu-pressable rounded-xl p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <DragOverlay>
          {activeLead && (
            <div className="rotate-2 opacity-90">
              <KanbanCard lead={activeLead} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {openLead && <LeadDrawer lead={openLead} onClose={() => setOpenLead(null)} />}
    </div>
  );
}

function KanbanColumn({ stage, children }: { stage: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} className={isOver ? "ring-2 ring-primary/30 rounded-2xl" : ""}>
      {children}
    </div>
  );
}

const KanbanCard = memo(function KanbanCard({
  lead,
  onClick,
}: {
  lead: Lead;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  const ds = daysSilent(lead.last_contact);
  const sc = scoreColor(lead.signal_score);
  const atRisk = ds !== null && ds >= 5 && !["Won", "Lost"].includes(lead.stage);
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`${atRisk ? "neu-risk-glow" : "neu-raised-sm"} bg-background rounded-xl p-3 cursor-pointer ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="font-medium text-sm text-foreground truncate">{lead.name}</div>
      <div className="text-[11px] text-muted-foreground truncate">{lead.company || ""}</div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[11px] font-semibold text-foreground">
          ${Number(lead.deal_value).toLocaleString()}
        </span>
        <NeuBadge color={sc === "red" ? "red" : sc === "amber" ? "amber" : "green"}>
          {lead.signal_score}
        </NeuBadge>
      </div>
      {ds !== null && (
        <div
          className={`text-[10px] mt-1.5 ${ds >= 5 ? "text-destructive font-semibold" : "text-muted-foreground"}`}
        >
          {ds}d silent
        </div>
      )}
    </div>
  );
});
