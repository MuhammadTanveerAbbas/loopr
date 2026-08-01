import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useLeads, type Lead } from "@/lib/leads-api";
import { NeuCard } from "@/components/ui/neu";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { PageContainer, PageHeader, StatCard, EmptyState } from "@/components/ui/page";
import { DollarSign, Award, Clock3, Percent } from "lucide-react";

export const Route = createFileRoute("/_app/closed")({
  head: () => ({
    meta: [
      { title: "Closed Won - Loopr" },
      {
        name: "description",
        content:
          "Review your closed won deals, total revenue, average deal size, and days to close.",
      },
    ],
  }),
  component: Closed,
});

function Closed() {
  const { data, isLoading, error, refetch } = useLeads();
  const leads: Lead[] = useMemo(() => data?.leads ?? [], [data]);

  const won = useMemo(
    () =>
      leads
        .filter((l) => l.stage === "Won")
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [leads],
  );
  const total = won.reduce((s, l) => s + Number(l.deal_value), 0);
  const avg = won.length ? total / won.length : 0;
  const avgDays = won.length
    ? Math.round(
        won.reduce(
          (s, l) =>
            s + (new Date(l.updated_at).getTime() - new Date(l.created_at).getTime()) / 86400000,
          0,
        ) / won.length,
      )
    : 0;

  const lost = leads.filter((l) => l.stage === "Lost").length;
  const winRate = won.length + lost > 0 ? Math.round((won.length / (won.length + lost)) * 100) : 0;

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    won.forEach((l) => {
      const key = new Date(l.updated_at).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      months[key] = (months[key] || 0) + Number(l.deal_value);
    });
    return Object.entries(months).slice(-8);
  }, [won]);

  if (error) {
    return (
      <ErrorFallback
        error={error instanceof Error ? error : new Error(String(error))}
        reset={refetch}
        message="Failed to load closed deals"
      />
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-9 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="neu-raised p-4 rounded-xl">
              <Skeleton className="h-8 w-24 mx-auto" />
            </div>
          ))}
        </div>
        <div className="neu-raised rounded-2xl p-5">
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="neu-raised-sm p-3 rounded-xl flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="animate-fade-up">
      <PageHeader title="Closed Won" subtitle="Your wins, all in one place." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total revenue"
          value={`$${total.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
          accent="green"
          trend={null}
        />
        <StatCard
          label="Avg deal size"
          value={`$${Math.round(avg).toLocaleString()}`}
          icon={<Award className="h-4 w-4" />}
          accent="blue"
          trend={null}
        />
        <StatCard
          label="Avg days to close"
          value={`${avgDays}d`}
          icon={<Clock3 className="h-4 w-4" />}
          accent="amber"
          trend={null}
        />
        <StatCard
          label="Win rate"
          value={`${winRate}%`}
          icon={<Percent className="h-4 w-4" />}
          accent="purple"
          trend={null}
        />
      </div>

      {monthlyData.length > 0 && (
        <NeuCard className="rounded-2xl">
          <h2 className="text-sm font-semibold text-foreground mb-3">Monthly revenue</h2>
          <div className="overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-end gap-3 h-40 min-w-[320px]">
              {monthlyData.map(([month, value], i) => {
                const maxVal = Math.max(...monthlyData.map(([, v]) => v));
                const h = maxVal > 0 ? (value / maxVal) * 100 : 0;
                return (
                  <div
                    key={month}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <span className="text-[10px] font-bold text-foreground">
                      ${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString()}
                    </span>
                    <div
                      className="w-full max-w-[46px] border-[2.5px] border-black animate-bar-grow"
                      style={{
                        height: `${Math.max(h, 4)}%`,
                        background: "var(--success)",
                        borderRadius: "8px 8px 0 0",
                        boxShadow: "0 3px 0 #0A0A0A",
                        animationDelay: `${i * 0.08}s`,
                      }}
                    />
                    <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                      {month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </NeuCard>
      )}

      <NeuCard className="rounded-2xl">
        {won.length === 0 ? (
          <EmptyState title="No closed deals yet." message="Go close some." />
        ) : (
          <div>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {won.map((l) => (
                <div key={l.id} className="bg-white border-2 border-black rounded-xl p-3 shadow-[0_3px_0_#0a0a0a]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground truncate">{l.name}</div>
                      <div className="text-xs text-muted-foreground">{l.company || "—"}</div>
                    </div>
                    <span className="text-sm font-extrabold text-foreground shrink-0">${Number(l.deal_value).toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1.5">{new Date(l.updated_at).toLocaleDateString()}</div>
                  {l.notes && <div className="text-xs text-muted-foreground mt-1 truncate">{l.notes}</div>}
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="overflow-x-auto neu-inset rounded-xl p-2 hidden sm:block">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left px-3 py-2 font-semibold">Name</th>
                    <th className="text-left px-3 py-2 font-semibold">Company</th>
                    <th className="text-right px-3 py-2 font-semibold">Deal Value</th>
                    <th className="text-left px-3 py-2 font-semibold">Closed</th>
                    <th className="text-left px-3 py-2 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {won.map((l) => (
                    <tr key={l.id} className="hover:bg-foreground/[0.02] transition-colors">
                      <td className="px-3 py-2.5 font-medium text-foreground">{l.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{l.company || ""}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-foreground">${Number(l.deal_value).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs">{new Date(l.updated_at).toLocaleDateString()}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-xs truncate max-w-xs">{l.notes || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </NeuCard>
    </PageContainer>
  );
}
