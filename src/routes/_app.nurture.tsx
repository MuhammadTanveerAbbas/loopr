import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useLeads, type Lead } from "@/lib/leads-api";
import { NeuCard, NeuButton, NeuBadge } from "@/components/ui/neu";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { daysSilent } from "@/lib/signal-score";
import { Copy, Sparkles, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/nurture")({
  head: () => ({
    meta: [
      { title: "Nurture  Loopr" },
      {
        name: "description",
        content:
          "Re-engage leads that have gone cold. AI-generated draft messages to bring them back.",
      },
    ],
  }),
  component: Nurture,
});

function Nurture() {
  const { data, isLoading, error, refetch } = useLeads();
  const leads = useMemo(() => data?.leads ?? [], [data]);

  const targets = useMemo(
    () =>
      leads
        .filter(
          (l: Lead) =>
            !["Won", "Lost"].includes(l.stage) &&
            l.has_reply &&
            (daysSilent(l.last_contact) ?? 0) > 5,
        )
        .slice(0, 20),
    [leads],
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (error) {
    return (
      <ErrorFallback
        error={error instanceof Error ? error : new Error(String(error))}
        reset={refetch}
        message="Failed to load nurture leads"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 p-6">
        <div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="neu-raised p-4 rounded-xl">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const draft = async (id: string, name: string, company: string | null, stage: string) => {
    setBusy(id);
    try {
      const res = await supabase.functions.invoke("ai-task", {
        body: { task: "reengage", payload: { name, company, stage } },
      });
      if (res.error) throw res.error;
      setDrafts({ ...drafts, [id]: res.data?.output ?? "" });
    } catch {
      toast.error("Failed to generate draft");
    } finally {
      setBusy(null);
    }
  };

  const generateAll = async () => {
    for (const l of targets) {
      await draft(l.id, l.name, l.company, l.stage);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-up">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Nurture</h1>
        <p className="text-sm text-muted-foreground">
          Leads that had momentum but went cold. Bring them back.
        </p>
      </header>

      <NeuCard className="rounded-2xl">
        {targets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">&#10024;</div>
            <p className="font-medium text-sm text-muted-foreground">
              No leads need re-engaging right now.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Leads appear here when they have a reply but have been silent for more than 5 days.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-muted-foreground">
                {targets.length} lead{targets.length > 1 ? "s" : ""} need attention
              </p>
              <NeuButton size="sm" onClick={generateAll} disabled={targets.length === 0}>
                <Sparkles className="h-3 w-3 mr-1 inline" />
                Draft all
              </NeuButton>
            </div>
            <div className="space-y-3">
              {targets.map((l, i) => (
                <div
                  key={l.id}
                  className="neu-raised-sm rounded-xl p-4 animate-fade-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-foreground/10 border-2 border-black flex items-center justify-center text-sm font-extrabold shrink-0">
                        {l.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground">{l.name}</div>
                        <div className="text-xs text-muted-foreground">{l.company || ""}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <NeuBadge>{l.stage}</NeuBadge>
                          <NeuBadge color="red">{daysSilent(l.last_contact)}d silent</NeuBadge>
                        </div>
                      </div>
                    </div>
                    <NeuButton
                      size="sm"
                      onClick={() => draft(l.id, l.name, l.company, l.stage)}
                      disabled={busy === l.id}
                    >
                      <Mail className="h-3 w-3 inline mr-1" />
                      {busy === l.id ? "..." : "Draft"}
                    </NeuButton>
                  </div>
                  {drafts[l.id] && (
                    <div className="mt-3 neu-inset rounded-xl p-3 text-sm text-foreground whitespace-pre-wrap relative">
                      {drafts[l.id]}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(drafts[l.id]!);
                          toast.success("Copied to clipboard");
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
          </div>
        )}
      </NeuCard>
    </div>
  );
}
