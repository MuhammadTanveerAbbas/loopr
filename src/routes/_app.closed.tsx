import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useLeads } from "@/lib/leads-api";
import { NeuCard } from "@/components/ui/neu";

export const Route = createFileRoute("/_app/closed")({
  head: () => ({ meta: [{ title: "Closed Won — Loopr" }] }),
  component: Closed,
});

function Closed() {
  const { data: leads = [] } = useLeads();
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

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Closed Won</h1>
        <p className="text-sm text-muted-foreground">Your wins, all in one place.</p>
      </header>

      <div className="grid grid-cols-3 gap-5">
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
      </div>

      <NeuCard className="rounded-2xl">
        {won.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            No closed deals yet. Go close some.
          </p>
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
                  <tr key={l.id}>
                    <td className="px-3 py-2.5 font-medium text-foreground">{l.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{l.company || "—"}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-foreground">
                      ${Number(l.deal_value).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">
                      {new Date(l.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs truncate max-w-xs">
                      {l.notes || "—"}
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
