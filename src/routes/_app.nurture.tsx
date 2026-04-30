import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useLeads } from "@/lib/leads-api";
import { NeuCard, NeuButton, NeuBadge } from "@/components/ui/neu";
import { daysSilent } from "@/lib/signal-score";
import { Copy, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/nurture")({
  head: () => ({ meta: [{ title: "Nurture — Loopr" }] }),
  component: Nurture,
});

function Nurture() {
  const { data: leads = [] } = useLeads();
  const targets = useMemo(
    () =>
      leads
        .filter(
          (l) =>
            !["Won", "Lost"].includes(l.stage) &&
            l.has_reply &&
            (daysSilent(l.last_contact) ?? 0) > 5,
        )
        .slice(0, 20),
    [leads],
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const draft = async (id: string, name: string, company: string | null, stage: string) => {
    setBusy(id);
    try {
      const res = await supabase.functions.invoke("ai-task", {
        body: { task: "reengage", payload: { name, company, stage } },
      });
      if (res.error) throw res.error;
      setDrafts({ ...drafts, [id]: res.data?.output ?? "" });
    } catch {
      toast.error("Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Nurture</h1>
        <p className="text-sm text-muted-foreground">
          Leads that had momentum but went cold. Bring them back.
        </p>
      </header>

      <NeuCard className="rounded-2xl">
        {targets.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            No leads need re-engaging right now.
          </p>
        ) : (
          <div className="space-y-3">
            {targets.map((l) => (
              <div key={l.id} className="neu-raised-sm rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{l.name}</span>
                      <span className="text-sm text-muted-foreground">· {l.company || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <NeuBadge>{l.stage}</NeuBadge>
                      <NeuBadge color="red">{daysSilent(l.last_contact)}d silent</NeuBadge>
                    </div>
                  </div>
                  <NeuButton
                    size="sm"
                    onClick={() => draft(l.id, l.name, l.company, l.stage)}
                    disabled={busy === l.id}
                  >
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    {busy === l.id ? "..." : "Draft"}
                  </NeuButton>
                </div>
                {drafts[l.id] && (
                  <div className="mt-3 neu-inset rounded-xl p-3 text-sm text-foreground whitespace-pre-wrap relative">
                    {drafts[l.id]}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(drafts[l.id]);
                        toast.success("Copied");
                      }}
                      className="absolute top-2 right-2 neu-pressable rounded-lg p-1.5"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </NeuCard>
    </div>
  );
}
