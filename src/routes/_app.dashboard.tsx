import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useDashboardStats, useTrendingLeads } from "@/lib/leads-api";
import { NeuButton } from "@/components/ui/neu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Users,
  DollarSign,
  MessageSquare,
  Trophy,
  RefreshCw,
  AlertTriangle,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Loopr" },
      { name: "description", content: "Your CRM pipeline dashboard." },
    ],
  }),
  component: Dashboard,
});

/* ── Animated counter ── */
function AnimatedValue({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    raf.current = requestAnimationFrame(function tick(now) {
      const p = Math.min((now - start) / 900, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * e));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    });
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

/* ── Stat card ── */
const STAT_STYLES = {
  yellow: { card: "bg-brand-yellow", icon: "bg-black/10 text-foreground" },
  green:  { card: "bg-[var(--success)]", icon: "bg-black/10 text-foreground" },
  pink:   { card: "bg-brand-pink", icon: "bg-white/20 text-white" },
  white:  { card: "bg-white", icon: "bg-foreground/8 text-foreground" },
} as const;

function StatCard({
  label, value, icon, style, trend,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  style: keyof typeof STAT_STYLES;
  trend?: number | null;
}) {
  const s = STAT_STYLES[style];
  const isLight = style === "yellow" || style === "green" || style === "white";
  return (
    <div className={`${s.card} border-2 border-black rounded-2xl p-4 shadow-[0_5px_0_#0a0a0a] flex flex-col gap-3 animate-fade-up`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`w-9 h-9 rounded-xl border-2 border-black/20 flex items-center justify-center shrink-0 ${s.icon}`}>
          {icon}
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border border-black/15
            ${trend > 0 ? "bg-black/10 text-foreground" : trend < 0 ? "bg-black/10 text-foreground" : "bg-black/5 text-foreground/60"}`}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {trend > 0 ? "+" : ""}{trend}
          </div>
        )}
      </div>
      <div>
        <div className={`text-2xl font-extrabold tracking-tight ${isLight ? "text-foreground" : "text-white"}`}>
          {value}
        </div>
        <div className={`text-xs font-semibold mt-0.5 ${isLight ? "text-foreground/60" : "text-white/70"}`}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ── Section header ── */
function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground/70">{children}</h2>
      {action}
    </div>
  );
}

/* ── Card wrapper ── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border-2 border-black rounded-2xl shadow-[0_5px_0_#0a0a0a] p-5 ${className}`}>
      {children}
    </div>
  );
}

/* ── Dashboard ── */
function Dashboard() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const { data: recentLeads = [] } = useTrendingLeads(5);

  if (error) return (
    <div className="max-w-md mx-auto mt-16">
      <Card className="text-center">
        <RefreshCw className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <h2 className="text-base font-extrabold text-foreground mb-1">Failed to load dashboard</h2>
        <p className="text-sm text-muted-foreground mb-4">Something went wrong loading your pipeline stats.</p>
        <NeuButton variant="primary" onClick={() => refetch()}>Retry</NeuButton>
      </Card>
    </div>
  );

  if (isLoading) return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );

  if (!stats) return null;

  const stageCounts = stats.stage_counts || {};
  const atRisk = stats.at_risk || [];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your pipeline at a glance.</p>
        </div>
        <Link
          to="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide bg-foreground text-background border-2 border-black rounded-xl px-3 py-2 shadow-[0_3px_0_#0a0a0a] hover:shadow-none hover:translate-y-px transition-all shrink-0"
        >
          All leads <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Leads"
          value={<AnimatedValue value={stats.total_leads} />}
          icon={<Users className="h-4 w-4" />}
          style="yellow"
          trend={stats.total_leads - stats.trends_prev_total}
        />
        <StatCard
          label="Pipeline Value"
          value={<AnimatedValue value={stats.pipeline_value} prefix="$" />}
          icon={<DollarSign className="h-4 w-4" />}
          style="green"
        />
        <StatCard
          label="Reply Rate"
          value={<AnimatedValue value={stats.reply_rate} suffix="%" />}
          icon={<MessageSquare className="h-4 w-4" />}
          style="pink"
        />
        <StatCard
          label="Won This Month"
          value={<AnimatedValue value={stats.won_count_month} />}
          icon={<Trophy className="h-4 w-4" />}
          style="white"
          trend={stats.won_count_month - stats.trends_prev_won}
        />
      </div>

      {/* Main row: chart + funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            action={
              <span className="text-xs font-bold text-muted-foreground bg-foreground/[0.06] border border-black/10 px-2.5 py-1 rounded-lg">
                {stats.pipeline_leads} active
              </span>
            }
          >
            Pipeline by stage
          </SectionTitle>
          <PipelineBarChart stageCounts={stageCounts} />
        </Card>

        <Card>
          <SectionTitle>Conversion funnel</SectionTitle>
          <FunnelChart stageCounts={stageCounts} />
        </Card>
      </div>

      {/* Bottom row: recent + at-risk + quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

        {/* Recent activity */}
        <Card className="lg:col-span-1">
          <SectionTitle
            action={
              <Link to="/activity" className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            Recent activity
          </SectionTitle>
          <div className="space-y-2">
            {recentLeads.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No recent leads.</p>
            ) : recentLeads.map((lead, i) => (
              <div
                key={lead.id}
                className="flex items-center gap-3 p-2.5 rounded-xl border-2 border-black/8 hover:border-black/20 hover:bg-foreground/[0.02] transition-all animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-8 h-8 rounded-xl bg-brand-yellow border-2 border-black flex items-center justify-center text-xs font-extrabold shrink-0">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-foreground truncate">{lead.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{lead.company || "—"} · {lead.stage}</div>
                </div>
                <div className="text-xs font-extrabold text-foreground shrink-0">
                  ${Number(lead.deal_value).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* At-risk */}
        <Card className="lg:col-span-1">
          <SectionTitle
            action={
              atRisk.length > 0 ? (
                <span className="text-[10px] font-extrabold bg-destructive text-white border-2 border-black px-2 py-0.5 rounded-full shadow-[0_2px_0_#0a0a0a]">
                  {atRisk.length}
                </span>
              ) : undefined
            }
          >
            <span className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-destructive" /> At-risk leads
            </span>
          </SectionTitle>
          <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
            {atRisk.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-2xl mb-1">🎉</div>
                <p className="text-xs font-semibold text-muted-foreground">No at-risk leads. Keep it up!</p>
              </div>
            ) : atRisk.map((l, i) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl border-2 border-destructive/30 bg-destructive/[0.04] animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{l.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{l.company || "—"}</div>
                </div>
                <span className="shrink-0 text-[10px] font-extrabold text-destructive bg-destructive/10 border border-destructive/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {l.days_silent}d silent
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick stats + CTA */}
        <Card className="lg:col-span-1 flex flex-col gap-4">
          <div>
            <SectionTitle>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Quick stats
              </span>
            </SectionTitle>
            <div className="space-y-3">
              {[
                { label: "Total won", value: `${stats.won_count} deals` },
                { label: "Total revenue", value: `$${stats.total_won.toLocaleString()}` },
                { label: "Won this month", value: `$${stats.won_value_month.toLocaleString()}` },
                { label: "Active leads", value: stats.pipeline_leads },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-black/8 last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-extrabold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI CTA */}
          <div className="mt-auto bg-brand-yellow border-2 border-black rounded-xl p-3.5 shadow-[0_3px_0_#0a0a0a]">
            <div className="flex items-start gap-2.5">
              <Brain className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-extrabold text-foreground mb-0.5">AI Workspace</div>
                <p className="text-[11px] text-foreground/70 leading-relaxed">
                  Score leads and get daily briefings on who to follow up with.
                </p>
                <Link
                  to="/ai"
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-foreground mt-2 hover:underline"
                >
                  Open AI Workspace <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Bar chart ── */
const STAGE_COLORS: Record<string, string> = {
  "New":           "#ffe14d",
  "Contacted":     "#0a0a0a",
  "Replied":       "#ff6b35",
  "Call Booked":   "#2ecc71",
  "Proposal Sent": "#ff6b9d",
  "Negotiating":   "#ff6b35",
};

function PipelineBarChart({ stageCounts }: { stageCounts: Record<string, number> }) {
  const stages = Object.keys(STAGE_COLORS).map(key => ({ key, color: STAGE_COLORS[key], count: stageCounts[key] || 0 }));
  const max = Math.max(1, ...stages.map(s => s.count));
  const niceMax = Math.max(4, Math.ceil(max / 4) * 4);
  const ticks = [niceMax, Math.round(niceMax * 0.75), Math.round(niceMax * 0.5), Math.round(niceMax * 0.25), 0];

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="min-w-[340px]">
        <div className="flex gap-3">
          {/* Y axis */}
          <div className="flex flex-col justify-between text-[10px] font-bold text-foreground/40 py-0.5 w-5 text-right shrink-0">
            {ticks.map(t => <span key={t}>{t}</span>)}
          </div>
          {/* Chart area */}
          <div className="flex-1 relative h-48 border-l-2 border-b-2 border-black/20">
            {ticks.slice(0, -1).map((_, i) => (
              <div key={i} className="absolute left-0 right-0 border-t border-dashed border-black/10"
                style={{ top: `${(i / (ticks.length - 1)) * 100}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end justify-around px-2 gap-1.5">
              {stages.map((d, i) => {
                const h = Math.max((d.count / niceMax) * 100, d.count > 0 ? 3 : 0);
                return (
                  <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                    {d.count > 0 && <span className="text-[10px] font-extrabold text-foreground">{d.count}</span>}
                    <div
                      className="w-full max-w-[40px] border-2 border-black animate-bar-grow"
                      style={{
                        height: `${h}%`,
                        background: d.color,
                        borderRadius: "6px 6px 0 0",
                        boxShadow: "0 3px 0 #0a0a0a",
                        animationDelay: `${i * 0.07}s`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* X labels */}
        <div className="flex gap-3 mt-1.5">
          <div className="w-5 shrink-0" />
          <div className="flex-1 flex justify-around px-2 gap-1.5">
            {stages.map(d => (
              <div key={d.key} className="flex-1 text-center text-[9px] font-extrabold text-foreground/50 uppercase leading-tight">
                {d.key.replace(" ", "\n")}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-4 justify-center">
          {stages.map(d => (
            <div key={d.key} className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70">
              <span className="w-2.5 h-2.5 rounded-sm border border-black/30 shrink-0" style={{ background: d.color }} />
              {d.key}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Funnel ── */
const FUNNEL_COLORS: Record<string, string> = {
  "New":           "#ffe14d",
  "Contacted":     "#0a0a0a",
  "Replied":       "#ff6b35",
  "Call Booked":   "#2ecc71",
  "Proposal Sent": "#ff6b9d",
  "Negotiating":   "#ff6b35",
  "Won":           "#2ecc71",
};
const FUNNEL_TEXT: Record<string, string> = {
  "#ffe14d": "text-foreground",
  "#0a0a0a": "text-white",
  "#ff6b35": "text-white",
  "#2ecc71": "text-foreground",
  "#ff6b9d": "text-white",
};

function FunnelChart({ stageCounts }: { stageCounts: Record<string, number> }) {
  const order = ["New", "Contacted", "Replied", "Call Booked", "Proposal Sent", "Negotiating", "Won"];
  const steps = order.map(s => ({ stage: s, count: stageCounts[s] || 0, color: FUNNEL_COLORS[s] })).filter(s => s.count > 0);
  const max = Math.max(1, ...steps.map(s => s.count));

  if (steps.length === 0) return (
    <p className="text-xs text-muted-foreground text-center py-8">No data yet.</p>
  );

  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const w = Math.max(20, Math.round((s.count / max) * 100));
        const next = steps[i + 1];
        const conv = next && s.count > 0 ? Math.round((next.count / s.count) * 100) : null;
        const textColor = FUNNEL_TEXT[s.color ?? ""] ?? "text-foreground";
        return (
          <div key={s.stage}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-foreground">{s.stage}</span>
              <span className="text-muted-foreground font-semibold">
                {s.count}{conv !== null ? ` → ${conv}%` : ""}
              </span>
            </div>
            <div className="h-6 bg-foreground/5 border-2 border-black rounded-lg overflow-hidden">
              <div
                className={`h-full flex items-center justify-end pr-2 border-r-2 border-black transition-all duration-700 animate-fade-up`}
                style={{ width: `${w}%`, background: s.color }}
              >
                <span className={`text-[10px] font-extrabold ${textColor}`}>{s.count}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
