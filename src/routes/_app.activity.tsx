import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NeuCard } from "@/components/ui/neu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import type { AuditLog } from "@/lib/leads-api";

export const Route = createFileRoute("/_app/activity")({
  head: () => ({
    meta: [
      { title: "Activity  Loopr" },
      {
        name: "description",
        content: "Recent AI activity and system audit events for your CRM pipeline.",
      },
    ],
  }),
  component: ActivityPage,
});

interface AiLog {
  id: string;
  type: string;
  created_at: string;
  input: string | null;
}

function ActivityPage() {
  const { user } = useAuth();

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["audit_logs"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const { data: aiLogs = [] } = useQuery({
    queryKey: ["ai_logs_recent"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 p-6">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="neu-raised p-4 rounded-xl">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Activity</h1>
        <p className="text-sm text-muted-foreground">Recent AI calls and system events.</p>
      </header>

      <NeuCard className="rounded-2xl">
        <h2 className="text-sm font-semibold text-foreground mb-3">AI Activity</h2>
        {aiLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No AI activity yet.</p>
        ) : (
          <div className="space-y-2">
            {aiLogs.map((log: AiLog) => (
              <div key={log.id} className="neu-raised-sm rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-semibold uppercase">{log.type}</span>
                  <span>{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
                {log.input && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{log.input}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </NeuCard>

      <NeuCard className="rounded-2xl">
        <h2 className="text-sm font-semibold text-foreground mb-3">System Events</h2>
        {auditLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No system events yet.</p>
        ) : (
          <div className="space-y-2">
            {auditLogs.map((log: AuditLog) => (
              <div key={log.id} className="neu-raised-sm rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-semibold">{log.action}</span>
                  <span>{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {log.table_name} {log.record_id ? `· ${log.record_id.slice(0, 8)}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </NeuCard>
    </div>
  );
}
