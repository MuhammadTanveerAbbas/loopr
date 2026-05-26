import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useLeads, type Lead } from "@/lib/leads-api";
import { NeuCard } from "@/components/ui/neu";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { data, isLoading } = useLeads();
  const leads: Lead[] = data?.leads ?? [];

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
    return Object.entries(months).slice(-6);
  }, [won]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 p-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="neu-raised p-4 rounded-xl text-center">
              <Skeleton className="h-4 w-16 mx-auto mb-2" />
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
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-up">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Closed Won</h1>
        <p className="text-sm text-muted-foreground">Your wins, all in one place.</p>
      </header>

      <div className="grid grid-cols-4 gap-5">
        <div className="accent-strip-green bg-background rounded-2xl p-5">
          <div className="text-2xl font-bold text-foreground">${total.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">Total revenue</div>
        </div>
        <div className="accent-strip-blue bg-background rounded-2xl p-5">
          <div className="text-2xl font-bold text-foreground">
            ${Math.round(avg).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Avg deal size</div>
        </div>
        <div className="accent-strip-amber bg-background rounded-2xl p-5">
          <div className="text-2xl font-bold text-foreground">{avgDays}d</div>
          <div className="text-xs text-muted-foreground mt-1">Avg days to close</div>
        </div>
        <div className="accent-strip-purple bg-background rounded-2xl p-5">
          <div className="text-2xl font-bold text-foreground">{winRate}%</div>
          <div className="text-xs text-muted-foreground mt-1">Win rate</div>
        </div>
      </div>

      {monthlyData.length > 0 && (
        <NeuCard className="rounded-2xl">
          <h2 className="text-sm font-semibold text-foreground mb-3">Monthly revenue</h2>
          <div className="flex items-end gap-3 h-32">
            {monthlyData.map(([month, value], i) => {
              const maxVal = Math.max(...monthlyData.map(([, v]) => v));
              const h = maxVal > 0 ? (value / maxVal) * 100 : 0;
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-foreground">
                    ${value.toLocaleString()}
                  </span>
                  <div
                    className="w-full border-[2.5px] border-black animate-bar-grow"
                    style={{
                      height: `${Math.max(h, 4)}%`,
                      background: "var(--success)",
                      borderRadius: "8px 8px 0 0",
                      boxShadow: "0 3px 0 #0A0A0A",
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                  <span className="text-[9px] font-bold text-muted-foreground">{month}</span>
                </div>
              );
            })}
          </div>
        </NeuCard>
      )}

      <NeuCard className="rounded-2xl">
        {won.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-medium text-muted-foreground">No closed deals yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Go close some.</p>
          </div>
        ) : (
          <div className="overflow-x-auto neu-inset rounded-xl p-2">
            <table className="w-full text-sm">
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
                    <td className="px-3 py-2.5 text-right font-semibold text-foreground">
                      ${Number(l.deal_value).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">
                      {new Date(l.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs truncate max-w-xs">
                      {l.notes || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NeuCard>
    </div>
  );
}
