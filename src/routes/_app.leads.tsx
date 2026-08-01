import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  useLeads,
  useUpdateLead,
  useCreateLead,
  useDeleteLead,
  STAGES,
  type Lead,
} from "@/lib/leads-api";
import { NeuCard, NeuButton, NeuInput, NeuSelect, NeuBadge } from "@/components/ui/neu";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { daysSilent, scoreColor } from "@/lib/signal-score";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Search, Trash2, Download } from "lucide-react";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/lib/error-service";
import { ErrorFallback } from "@/components/ui/error-fallback";

export const Route = createFileRoute("/_app/leads")({
  head: () => ({ meta: [{ title: "Leads  Loopr" }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useLeads();
  const leads = useMemo(() => data?.leads ?? [], [data]);
  const update = useUpdateLead();
  const create = useCreateLead();
  const del = useDeleteLead();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"signal" | "silent" | "value" | "contact">("signal");
  const [openLead, setOpenLead] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handle = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportOpen(false);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [exportOpen]);

  const filtered = useMemo(() => {
    let r = leads.slice();
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(
        (l: Lead) =>
          l.name.toLowerCase().includes(s) || (l.company ?? "").toLowerCase().includes(s),
      );
    }
    if (stageFilter !== "all") r = r.filter((l) => l.stage === stageFilter);
    if (sortBy === "signal") r.sort((a, b) => b.signal_score - a.signal_score);
    if (sortBy === "silent")
      r.sort((a, b) => (daysSilent(b.last_contact) ?? -1) - (daysSilent(a.last_contact) ?? -1));
    if (sortBy === "value") r.sort((a, b) => Number(b.deal_value) - Number(a.deal_value));
    if (sortBy === "contact")
      r.sort((a, b) => (b.last_contact || "").localeCompare(a.last_contact || ""));
    return r;
  }, [leads, search, stageFilter, sortBy]);

  if (error) {
    return (
      <ErrorFallback
        error={error instanceof Error ? error : new Error(String(error))}
        reset={refetch}
        message="Failed to load leads"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="neu-raised p-4 rounded-xl">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((l) => l.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };
  const bulkStageUpdate = (stage: string) => {
    Array.from(selectedIds).forEach((id) =>
      update.mutate({
        id,
        patch: { stage, stage_changed_at: new Date().toISOString() },
        userId: user!.id,
      }),
    );
    toast.success(`${selectedIds.size} leads updated`);
    setSelectedIds(new Set());
  };
  const bulkDelete = () => {
    selectedIds.forEach((id) => del.mutate({ id, userId: user!.id }));
    toast.success(`${selectedIds.size} leads moved to trash`);
    setSelectedIds(new Set());
  };

  const addLead = async () => {
    if (!user) return;
    try {
      await create.mutateAsync({ user_id: user.id, name: "New lead", stage: "Contacted" });
      toast.success("Lead added");
    } catch (e) {
      toast.error(sanitizeErrorMessage(e, "Failed to add lead. Please try again."));
    }
  };

  const exportCsv = async (all: boolean) => {
    const data = all ? leads : filtered;
    const headers = [
      "Name",
      "Company",
      "Niche",
      "Stage",
      "Deal Value",
      "Signal",
      "Last Contact",
      "Days Silent",
      "Next Action",
    ];
    const rows = data.map((l) => [
      l.name,
      l.company || "",
      l.niche || "",
      l.stage,
      l.deal_value,
      l.signal_score,
      l.last_contact || "",
      daysSilent(l.last_contact) ?? "",
      l.next_action || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = all ? "leads-all.csv" : "leads-filtered.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer className="max-w-[1400px]">
      <PageHeader
        title="Leads"
        subtitle={`${filtered.length} of ${leads.length} leads`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative" ref={exportRef}>
              <NeuButton
                size="sm"
                onClick={() => setExportOpen((v) => !v)}
                aria-expanded={exportOpen}
                aria-haspopup="true"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 inline" />
                Export
              </NeuButton>
              {exportOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-40 rounded-xl neu-raised-sm bg-background p-1 z-10"
                  role="menu"
                >
                  <button
                    onClick={() => {
                      exportCsv(false);
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-foreground/5 rounded-lg"
                    role="menuitem"
                  >
                    Export visible
                  </button>
                  <button
                    onClick={() => {
                      exportCsv(true);
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-foreground/5 rounded-lg"
                    role="menuitem"
                  >
                    Export all leads
                  </button>
                </div>
              )}
            </div>
            <NeuButton variant="primary" onClick={addLead}>
              <Plus className="h-4 w-4 mr-1.5 inline" />
              Add Lead
            </NeuButton>
          </div>
        }
      />

      <NeuCard className="rounded-2xl">
        <div className="flex flex-col gap-2 mb-4">
          <div className="relative w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <NeuInput
              placeholder="Search name or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <NeuSelect value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="flex-1 min-w-0">
              <option value="all">All stages</option>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </NeuSelect>
            <NeuSelect value={sortBy} onChange={(e) => setSortBy(e.target.value as "signal" | "silent" | "value" | "contact")} className="flex-1 min-w-0">
              <option value="signal">Sort: Signal</option>
              <option value="silent">Sort: Silent</option>
              <option value="value">Sort: Value</option>
              <option value="contact">Sort: Contact</option>
            </NeuSelect>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="neu-raised-sm rounded-xl mb-3 p-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-xs font-extrabold text-foreground bg-foreground/10 px-2 py-1 rounded-lg">
                {selectedIds.size} selected
              </span>
              <div className="h-4 w-px bg-black/20 mx-1" />
              {STAGES.filter((s) => !["Won", "Lost"].includes(s)).map((s) => (
                <button
                  key={s}
                  onClick={() => bulkStageUpdate(s)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg hover:bg-foreground/10 border-2 border-black/30 transition-all whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
              <div className="h-4 w-px bg-black/20 mx-1" />
              <button
                onClick={bulkDelete}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg text-destructive hover:bg-destructive/10 border-2 border-destructive/30"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg hover:bg-foreground/10 border-2 border-black/20"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto neu-inset rounded-xl p-2">
          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {filtered.map((l) => {
              const ds = daysSilent(l.last_contact);
              const sc = scoreColor(l.signal_score);
              return (
                <div
                  key={l.id}
                  className="bg-white border-2 border-black rounded-xl p-3 shadow-[0_3px_0_#0a0a0a] cursor-pointer"
                  onClick={() => setOpenLead(l)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground truncate">{l.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{l.company || "—"}</div>
                    </div>
                    <NeuBadge color={sc === "red" ? "red" : sc === "amber" ? "amber" : "green"}>{l.signal_score}</NeuBadge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs font-extrabold text-foreground">${Number(l.deal_value).toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-muted-foreground border border-black/20 px-1.5 py-0.5 rounded-full">{l.stage}</span>
                    {ds !== null && <span className={`text-[10px] font-semibold ${ds >= 5 ? "text-destructive" : "text-muted-foreground"}`}>{ds}d silent</span>}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">
                {leads.length === 0 ? "No leads yet. Click Add Lead to start." : "No leads match your filters."}
              </p>
            )}
          </div>
          {/* Desktop table */}
          <table className="w-full text-sm hidden sm:table">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="w-8 px-1 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="text-left px-3 py-2 font-semibold">Name</th>
                <th className="text-left px-3 py-2 font-semibold">Company</th>
                <th className="text-left px-3 py-2 font-semibold">Stage</th>
                <th className="text-right px-3 py-2 font-semibold">Deal $</th>
                <th className="text-center px-3 py-2 font-semibold">Signal</th>
                <th className="text-center px-3 py-2 font-semibold">Silent</th>
                <th className="text-left px-3 py-2 font-semibold">Next Action</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const ds = daysSilent(l.last_contact);
                const sc = scoreColor(l.signal_score);
                return (
                  <tr
                    key={l.id}
                    className="group cursor-pointer transition-all duration-100 hover:bg-foreground/[0.02]"
                    onClick={() => setOpenLead(l)}
                  >
                    <td className="px-1 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(l.id)}
                        onChange={() => toggleOne(l.id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        defaultValue={l.name}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) =>
                          e.target.value !== l.name &&
                          update.mutate({
                            id: l.id,
                            patch: { name: e.target.value },
                            userId: user!.id,
                          })
                        }
                        className="bg-transparent w-full font-medium text-foreground outline-none focus:neu-input focus:px-2 focus:rounded-lg"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        defaultValue={l.company ?? ""}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) =>
                          e.target.value !== (l.company ?? "") &&
                          update.mutate({
                            id: l.id,
                            patch: { company: e.target.value },
                            userId: user!.id,
                          })
                        }
                        className="bg-transparent w-full text-muted-foreground outline-none focus:neu-input focus:px-2 focus:rounded-lg"
                      />
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <NeuSelect
                        value={l.stage}
                        onChange={(e) =>
                          update.mutate({
                            id: l.id,
                            patch: {
                              stage: e.target.value,
                              stage_changed_at: new Date().toISOString(),
                            },
                            userId: user!.id,
                          })
                        }
                        className="text-xs"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </NeuSelect>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <input
                        type="number"
                        defaultValue={Number(l.deal_value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          const parsed = Number(e.target.value);
                          if (!isNaN(parsed) && parsed !== Number(l.deal_value)) {
                            update.mutate({
                              id: l.id,
                              patch: { deal_value: parsed },
                              userId: user!.id,
                            });
                          }
                        }}
                        className="bg-transparent w-24 text-right text-foreground outline-none focus:neu-input focus:px-2 focus:rounded-lg"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <NeuBadge color={sc === "red" ? "red" : sc === "amber" ? "amber" : "green"}>
                        {l.signal_score}
                      </NeuBadge>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {ds === null ? (
                        <span className="text-muted-foreground text-xs"></span>
                      ) : (
                        <span
                          className={`text-xs font-semibold ${ds >= 5 ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {ds}d
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        defaultValue={l.next_action ?? ""}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) =>
                          e.target.value !== (l.next_action ?? "") &&
                          update.mutate({
                            id: l.id,
                            patch: { next_action: e.target.value },
                            userId: user!.id,
                          })
                        }
                        placeholder=""
                        className="bg-transparent w-full text-sm text-foreground outline-none focus:neu-input focus:px-2 focus:rounded-lg placeholder:text-muted-foreground"
                      />
                    </td>
                    <td className="px-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(l);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={`Delete ${l.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                    {leads.length === 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        <p className="font-medium">No leads yet</p>
                        <p className="text-xs">
                          Click <strong>Add Lead</strong> above to begin tracking your pipeline.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <p className="font-medium">No leads match your filters</p>
                        <p className="text-xs">
                          Try adjusting your search or clearing the stage filter.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} will be moved to trash. You can contact support to restore it if
              needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) del.mutate({ id: deleteTarget.id, userId: user!.id });
                setDeleteTarget(null);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {openLead && <LeadDrawer lead={openLead} onClose={() => setOpenLead(null)} />}
    </PageContainer>
  );
}
