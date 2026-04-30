import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useLeads, type Lead } from "@/lib/leads-api";
import { NeuCard, NeuButton, NeuBadge } from "@/components/ui/neu";
import { daysSilent } from "@/lib/signal-score";
import { ArrowDown, ArrowUp, RefreshCw, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Loopr" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: leads = [], isLoading } = useLeads();
  const { user } = useAuth();

  const stats = useMemo(() => {
    const active = leads.filter((l) => !["Won", "Lost"].includes(l.stage));
    const replied = leads.filter((l) => l.has_reply);
    const wonThisMonth = leads.filter((l) => {
      if (l.stage !== "Won") return false;
      const d = new Date(l.updated_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      total: leads.length,
      pipelineValue: active.reduce((s, l) => s + Number(l.deal_value), 0),
      replyRate: leads.length ? Math.round((replied.length / leads.length) * 100) : 0,
      wonCount: wonThisMonth.length,
      wonValue: wonThisMonth.reduce((s, l) => s + Number(l.deal_value), 0),
    };
  }, [leads]);

  const stageCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) map[l.stage] = (map[l.stage] || 0) + 1;
    return map;
  }, [leads]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your pipeline at a glance.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="Total Leads" value={String(stats.total)} accent="blue" trend={null} />
        <KpiCard
          label="Active Pipeline"
          value={`$${stats.pipelineValue.toLocaleString()}`}
          accent="green"
          trend={null}
        />
        <KpiCard label="Reply Rate" value={`${stats.replyRate}%`} accent="amber" trend={null} />
        <KpiCard
          label="Closed Won (mo)"
          value={`${stats.wonCount} · $${stats.wonValue.toLocaleString()}`}
          accent="purple"
          trend={null}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <NeuCard className="rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-foreground/60">
                  Pipeline by stage
                </div>
                <h2 className="text-lg font-extrabold text-foreground">Active deals breakdown</h2>
              </div>
              <div className="text-xs font-bold text-foreground/70">
                Total active:{" "}
                <span className="font-extrabold text-foreground">
                  {leads.filter((l) => !["Won", "Lost"].includes(l.stage)).length}
                </span>
              </div>
            </div>
            <PipelineBarChart stageCounts={stageCounts} />
          </NeuCard>

          <BriefingCard userId={user?.id} leads={leads} />
        </div>

        <NeuCard className="rounded-2xl">
          <h2 className="text-sm font-semibold text-foreground mb-4">At-risk leads</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {leads
              .filter((l) => !["Won", "Lost"].includes(l.stage))
              .map((l) => ({ l, d: daysSilent(l.last_contact) }))
              .filter((x) => x.d !== null && x.d! >= 5)
              .sort((a, b) => (b.d ?? 0) - (a.d ?? 0))
              .slice(0, 10)
              .map(({ l, d }) => (
                <div
                  key={l.id}
                  className="neu-raised-sm rounded-xl px-3 py-2.5 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{l.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {l.company || "—"}
                    </div>
                  </div>
                  <NeuBadge color="red">{d}d silent</NeuBadge>
                </div>
              ))}
            {!isLoading &&
              leads.filter((l) => (daysSilent(l.last_contact) ?? 0) >= 5).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No at-risk leads. Keep it up.
                </p>
              )}
          </div>
        </NeuCard>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
  trend,
}: {
  label: string;
  value: string;
  accent: "blue" | "green" | "amber" | "purple" | "red";
  trend: number | null;
}) {
  const map: Record<string, string> = {
    blue: "accent-strip-blue",
    green: "accent-strip-green",
    amber: "accent-strip-amber",
    purple: "accent-strip-purple",
    red: "accent-strip-red",
  };
  return (
    <div className={`${map[accent]} bg-background rounded-2xl p-5`}>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</div>
      {trend !== null && (
        <div
          className={`text-[11px] mt-2 inline-flex items-center gap-1 ${trend >= 0 ? "text-[oklch(0.585_0.143_152)]" : "text-destructive"}`}
        >
          {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(trend)}% vs last 7d
        </div>
      )}
    </div>
  );
}

function BriefingCard({ userId, leads }: { userId?: string; leads: Lead[] }) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      const summary = leads
        .slice(0, 30)
        .map(
          (l) =>
            `${l.name} (${l.company || "—"}) — stage: ${l.stage}, days_silent: ${daysSilent(l.last_contact) ?? "n/a"}, deal: $${l.deal_value}`,
        )
        .join("\n");
      const res = await supabase.functions.invoke("ai-task", {
        body: { task: "briefing", payload: { leads_summary: summary } },
      });
      if (res.error) throw res.error;
      setBriefing(res.data?.output ?? "No briefing available.");
    } catch {
      setBriefing("Couldn't generate briefing right now. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="accent-strip-purple bg-background rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[oklch(0.45_0.176_295)]" />
          <h2 className="text-sm font-semibold text-foreground">Your briefing for today</h2>
        </div>
        <NeuButton size="sm" onClick={run} disabled={busy || !leads.length}>
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
        </NeuButton>
      </div>
      {busy ? (
        <div className="space-y-2">
          <div className="h-3 neu-inset-sm rounded-full" />
          <div className="h-3 neu-inset-sm rounded-full w-5/6" />
          <div className="h-3 neu-inset-sm rounded-full w-2/3" />
        </div>
      ) : (
        <p className="text-sm text-foreground leading-relaxed">
          {briefing ??
            "Click refresh to generate today's briefing. The AI will scan your pipeline and highlight what to do next."}
        </p>
      )}
    </div>
  );
}

function PipelineBarChart({ stageCounts }: { stageCounts: Record<string, number> }) {
  const stages = [
    { key: "New", color: "var(--brand-yellow)" },
    { key: "Contacted", color: "var(--brand-orange)" },
    { key: "Replied", color: "var(--brand-pink)" },
    { key: "Call Booked", color: "var(--success)" },
    { key: "Proposal Sent", color: "var(--brand-orange)" },
    { key: "Negotiating", color: "var(--brand-pink)" },
  ];
  const data = stages.map((s) => ({ ...s, count: stageCounts[s.key] || 0 }));
  const max = Math.max(1, ...data.map((d) => d.count));
  // build a clean y-axis scale (4 ticks)
  const niceMax = Math.max(4, Math.ceil(max / 4) * 4);
  const ticks = [
    niceMax,
    Math.round((niceMax * 3) / 4),
    Math.round(niceMax / 2),
    Math.round(niceMax / 4),
    0,
  ];

  return (
    <div>
      <div className="flex gap-4">
        {/* Y axis */}
        <div className="flex flex-col justify-between text-[10px] font-extrabold text-foreground/60 py-1 w-6 text-right">
          {ticks.map((t) => (
            <div key={t} className="leading-none">
              {t}
            </div>
          ))}
        </div>
        {/* Plot area */}
        <div className="flex-1 relative h-56 border-l-2 border-b-2 border-black">
          {/* Grid lines */}
          {ticks.slice(0, -1).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-dashed border-black/15"
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            />
          ))}
          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-around gap-2 px-2 pb-0">
            {data.map((d, i) => {
              const h = (d.count / niceMax) * 100;
              return (
                <div
                  key={d.key}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-1.5"
                >
                  {d.count > 0 && (
                    <div className="text-[11px] font-extrabold text-foreground">{d.count}</div>
                  )}
                  <div
                    className="w-full max-w-[44px] border-[2.5px] border-black animate-bar-grow"
                    style={{
                      height: `${Math.max(h, 2)}%`,
                      background: d.color,
                      animationDelay: `${i * 0.08}s`,
                      borderRadius: "8px 8px 0 0",
                      boxShadow: "0 3px 0 #0A0A0A",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* X axis labels */}
      <div className="flex gap-4 mt-2">
        <div className="w-6" />
        <div className="flex-1 flex items-start justify-around gap-2 px-2">
          {data.map((d) => (
            <div
              key={d.key}
              className="flex-1 text-center text-[10px] font-extrabold text-foreground/80 uppercase leading-tight"
            >
              {d.key}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-bold text-foreground/80">
        {data.map((d) => (
          <div key={d.key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm border-2 border-black"
              style={{ background: d.color }}
            />
            {d.key}
          </div>
        ))}
      </div>
    </div>
  );
}
