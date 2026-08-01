import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NeuCard } from "@/components/ui/neu";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader, EmptyState } from "@/components/ui/page";
import { useAuth } from "@/hooks/use-auth";
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

type FilterTab = "all" | "ai" | "system";

const aiTypeLabels: Record<string, string> = {
  briefing: "Daily Briefing",
  reply_analysis: "Reply Analysis",
  icp_score: "ICP Scoring",
  recap: "Weekly Recap",
  reengage: "Nurture Draft",
  email_draft: "Email Draft",
  autopsy: "Deal Autopsy",
};

function ActivityPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterTab>("all");

  const {
    data: auditLogs = [],
    isLoading: auditLoading,
    error: auditError,
  } = useQuery({
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

  const {
    data: aiLogs = [],
    isLoading: aiLoading,
    error: aiError,
  } = useQuery({
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

  const isLoading = auditLoading || aiLoading;
  const error = auditError || aiError;

  const filteredAi = filter === "all" || filter === "ai" ? aiLogs : [];
  const filteredAudit = filter === "all" || filter === "system" ? auditLogs : [];

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="neu-raised rounded-2xl p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">Failed to load activity log</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong loading your activity data.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 p-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
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
    <PageContainer className="max-w-4xl animate-fade-up">
      <PageHeader title="Activity" subtitle="Recent AI calls and system events." />

      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "ai", "system"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`text-xs font-extrabold uppercase px-4 py-2 rounded-xl border-2 border-black transition-all ${
              filter === t
                ? "bg-foreground text-background"
                : "bg-background text-foreground hover:bg-foreground/5"
            }`}
          >
            {t === "all" ? "All" : t === "ai" ? "AI Activity" : "System Events"}
          </button>
        ))}
      </div>

      {filteredAi.length > 0 && (
        <NeuCard className="rounded-2xl animate-fade-up">
          <h2 className="text-sm font-semibold text-foreground mb-3">AI Activity</h2>
          <div className="space-y-2">
            {filteredAi.map((log: AiLog, i) => (
              <div
                key={log.id}
                className="neu-raised-sm rounded-xl px-3 py-2.5 animate-fade-up"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold uppercase text-foreground">
                    {aiTypeLabels[log.type] || log.type}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
                {log.input && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{log.input}</p>
                )}
              </div>
            ))}
          </div>
        </NeuCard>
      )}

      {filteredAudit.length > 0 && (
        <NeuCard className="rounded-2xl animate-fade-up">
          <h2 className="text-sm font-semibold text-foreground mb-3">System Events</h2>
          <div className="space-y-2">
            {filteredAudit.map((log: AuditLog, i) => (
              <div
                key={log.id}
                className="neu-raised-sm rounded-xl px-3 py-2.5 animate-fade-up"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground">{log.action}</span>
                  <span className="text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {log.table_name} {log.record_id ? `· ${log.record_id.slice(0, 8)}` : ""}
                </p>
              </div>
            ))}
          </div>
        </NeuCard>
      )}

      {filteredAi.length === 0 && filteredAudit.length === 0 && (
        <NeuCard className="rounded-2xl">
          <EmptyState
            title={
              filter === "ai"
                ? "No AI activity yet."
                : filter === "system"
                  ? "No system events yet."
                  : "No activity yet."
            }
          />
        </NeuCard>
      )}
    </PageContainer>
  );
}
