import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useEffect, useRef, useState } from "react";
import {
  useDashboardStats,
  useTrendingLeads,
  type Lead,
  type DashboardStats,
} from "@/lib/leads-api";
import { NeuCard, NeuBadge } from "@/components/ui/neu";
import { Skeleton } from "@/components/ui/skeleton";
import { daysSilent } from "@/lib/signal-score";
import { ArrowDown, ArrowUp, TrendingUp, Users, DollarSign, Reply, Trophy } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard  Loopr" },
      {
        name: "description",
        content:
          "Your CRM pipeline dashboard - KPI overview, stage breakdown, and at-risk lead alerts.",
      },
    ],
  }),
  component: Dashboard,
});

function AnimatedValue({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);
  const duration = 800;

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = value;
    ref.current = requestAnimationFrame(function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    });
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value]);

  return (
    <>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </>
  );
}

function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();
  const { data: recentLeads = [] } = useTrendingLeads(5);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="neu-raised p-4 rounded-2xl">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <NeuCard className="rounded-2xl p-5">
              <Skeleton className="h-4 w-40 mb-4" />
              <Skeleton className="h-64 w-full" />
            </NeuCard>
          </div>
          <NeuCard className="rounded-2xl p-5">
            <Skeleton className="h-4 w-24 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </NeuCard>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <NeuCard className="rounded-2xl p-8 text-center">
          <p className="text-destructive font-semibold">Failed to load dashboard data.</p>
          <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page.</p>
        </NeuCard>
      </div>
    );
  }

  const stageCounts = stats.stage_counts || {};
  const atRisk = stats.at_risk || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your pipeline at a glance.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Total Leads"
          value={stats.total_leads}
          icon={<Users className="h-4 w-4" />}
          accent="blue"
          trend={stats.total_leads - stats.trends_prev_total}
        />
        <KpiCard
          label="Active Pipeline"
          value={stats.pipeline_value}
          prefix="$"
          icon={<DollarSign className="h-4 w-4" />}
          accent="green"
          trend={null}
        />
        <KpiCard
          label="Reply Rate"
          value={stats.reply_rate}
          suffix="%"
          icon={<Reply className="h-4 w-4" />}
          accent="amber"
          trend={null}
        />
        <KpiCard
          label="Closed Won (mo)"
          value={stats.won_count_month}
          suffix={` · $${stats.won_value_month.toLocaleString()}`}
          icon={<Trophy className="h-4 w-4" />}
          accent="purple"
          trend={stats.won_count_month - stats.trends_prev_won}
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
                <span className="font-extrabold text-foreground">{stats.pipeline_leads}</span>
              </div>
            </div>
            <PipelineBarChart stageCounts={stageCounts} />
          </NeuCard>

          {recentLeads.length > 0 && (
            <NeuCard className="rounded-2xl">
              <h2 className="text-sm font-semibold text-foreground mb-3">Recent activity</h2>
              <div className="space-y-2">
                {recentLeads.map((lead, i) => (
                  <div
                    key={lead.id}
                    className="neu-raised-sm rounded-xl px-3 py-2.5 flex items-center justify-between animate-fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-foreground/10 border-2 border-black flex items-center justify-center text-xs font-extrabold shrink-0">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {lead.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {lead.company || ""} · {lead.stage}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-foreground">
                      ${Number(lead.deal_value).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </NeuCard>
          )}
        </div>

        <div className="space-y-5">
          <NeuCard className="rounded-2xl">
            <h2 className="text-sm font-semibold text-foreground mb-4">At-risk leads</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {atRisk.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No at-risk leads. Keep it up.
                </p>
              ) : (
                atRisk.map((l, i) => (
                  <div
                    key={l.id}
                    className="neu-raised-sm rounded-xl px-3 py-2.5 flex items-center justify-between animate-fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{l.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {l.company || ""}
                      </div>
                    </div>
                    <NeuBadge color="red">{l.days_silent}d silent</NeuBadge>
                  </div>
                ))
              )}
            </div>
          </NeuCard>

          <NeuCard className="rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[oklch(0.45_0.176_295)]" />
              <h2 className="text-sm font-semibold text-foreground">Quick stats</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total won</span>
                <span className="font-bold text-foreground">{stats.won_count} deals</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-bold text-foreground">
                  ${stats.total_won.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active leads</span>
                <span className="font-bold text-foreground">{stats.pipeline_leads}</span>
              </div>
            </div>
          </NeuCard>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  prefix = "",
  suffix = "",
  accent,
  trend,
  icon,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  accent: "blue" | "green" | "amber" | "purple" | "red";
  trend: number | null;
  icon?: React.ReactNode;
}) {
  const map: Record<string, string> = {
    blue: "accent-strip-blue",
    green: "accent-strip-green",
    amber: "accent-strip-amber",
    purple: "accent-strip-purple",
    red: "accent-strip-red",
  };
  return (
    <div className={`${map[accent]} rounded-2xl p-5 animate-fade-up`}>
      <div className="flex items-start justify-between">
        <div className="text-3xl font-bold text-foreground">
          {prefix}
          <AnimatedValue value={value} />
          {suffix}
        </div>
        {icon && <div className="text-foreground/60 mt-1">{icon}</div>}
      </div>
      <div className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</div>
      {trend !== null && (
        <div
          className={`text-[11px] mt-2 inline-flex items-center gap-1 ${trend >= 0 ? "text-[oklch(0.585_0.143_152)]" : "text-destructive"}`}
        >
          {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(trend)} vs last period
        </div>
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
        <div className="flex flex-col justify-between text-[10px] font-extrabold text-foreground/60 py-1 w-6 text-right">
          {ticks.map((t) => (
            <div key={t} className="leading-none">
              {t}
            </div>
          ))}
        </div>
        <div className="flex-1 relative h-56 border-l-2 border-b-2 border-black">
          {ticks.slice(0, -1).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-dashed border-black/15"
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            />
          ))}
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
