import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useLeads,
  useUpdateLead,
  useCreateLead,
  useDeleteLead,
  STAGES,
  STAGE_COLOR,
  type Lead,
} from "@/lib/leads-api";
import { NeuCard, NeuButton, NeuInput, NeuSelect, NeuBadge } from "@/components/ui/neu";
import { daysSilent, scoreColor } from "@/lib/signal-score";
import { useAuth } from "@/lib/auth";
import { Plus, Search, Trash2, X, Download } from "lucide-react";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/leads")({
  head: () => ({ meta: [{ title: "Leads — Loopr" }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const { user } = useAuth();
  const { data: leads = [] } = useLeads();
  const update = useUpdateLead();
  const create = useCreateLead();
  const del = useDeleteLead();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"signal" | "silent" | "value" | "contact">("signal");
  const [openLead, setOpenLead] = useState<Lead | null>(null);

  const filtered = useMemo(() => {
    let r = leads.slice();
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(
        (l) => l.name.toLowerCase().includes(s) || (l.company ?? "").toLowerCase().includes(s),
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

  const addLead = async () => {
    if (!user) return;
    try {
      await create.mutateAsync({ user_id: user.id, name: "New lead", stage: "Contacted" });
      toast.success("Lead added");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to add lead";
      toast.error(message);
    }
  };

  const exportCsv = () => {
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
    const rows = filtered.map((l) => [
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
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "leads.csv";
    a.click();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {leads.length} leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NeuButton onClick={exportCsv} size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5 inline" />
            Export
          </NeuButton>
          <NeuButton variant="primary" onClick={addLead}>
            <Plus className="h-4 w-4 mr-1.5 inline" />
            Add Lead
          </NeuButton>
        </div>
      </header>

      <NeuCard className="rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <NeuInput
              placeholder="Search name or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <NeuSelect value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="all">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NeuSelect>
          <NeuSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "signal" | "silent" | "value" | "contact")}
          >
            <option value="signal">Sort: Signal</option>
            <option value="silent">Sort: Days Silent</option>
            <option value="value">Sort: Deal Value</option>
            <option value="contact">Sort: Last Contact</option>
          </NeuSelect>
        </div>

        <div className="overflow-x-auto neu-inset rounded-xl p-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
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
                    className="group hover:bg-background cursor-pointer"
                    onClick={() => setOpenLead(l)}
                  >
                    <td className="px-3 py-2.5">
                      <input
                        defaultValue={l.name}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) =>
                          e.target.value !== l.name &&
                          update.mutate({ id: l.id, patch: { name: e.target.value } })
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
                          update.mutate({ id: l.id, patch: { company: e.target.value } })
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
                        onBlur={(e) =>
                          Number(e.target.value) !== Number(l.deal_value) &&
                          update.mutate({ id: l.id, patch: { deal_value: Number(e.target.value) } })
                        }
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
                        <span className="text-muted-foreground text-xs">—</span>
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
                          update.mutate({ id: l.id, patch: { next_action: e.target.value } })
                        }
                        placeholder="—"
                        className="bg-transparent w-full text-sm text-foreground outline-none focus:neu-input focus:px-2 focus:rounded-lg placeholder:text-muted-foreground"
                      />
                    </td>
                    <td className="px-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this lead?")) del.mutate(l.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                    No leads yet. Click "Add Lead" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>

      {openLead && <LeadDrawer lead={openLead} onClose={() => setOpenLead(null)} />}
    </div>
  );
}
