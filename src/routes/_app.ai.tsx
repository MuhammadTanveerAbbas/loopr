import { createFileRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { useState } from "react";
import { NeuCard, NeuButton, NeuTextarea, NeuBadge } from "@/components/ui/neu";
import { Brain, RefreshCw, Search, MessageSquare, Calendar, Skull } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLeads, type Lead } from "@/lib/leads-api";
import { daysSilent } from "@/lib/signal-score";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/ai")({
  head: () => ({ meta: [{ title: "AI Workspace — Loopr" }] }),
  component: AiPage,
});

function AiPage() {
  const { user } = useAuth();
  const { data: leads = [] } = useLeads();

  const { data: autopsies = [] } = useQuery({
    queryKey: ["ai_logs", "autopsy"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_logs")
        .select("*")
        .eq("type", "autopsy")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-foreground">AI Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Five tools, one workspace. They run only when you ask.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-5">
        <BriefingTool leads={leads} />
        <ReplyAnalyzer />
        <IcpScorer userId={user?.id} />
        <RecapTool leads={leads} />
      </div>

      <NeuCard className="rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Skull className="h-4 w-4 text-destructive" />
          <h2 className="text-sm font-semibold text-foreground">Deal Autopsies</h2>
        </div>
        {autopsies.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            When you mark a deal as Lost, an autopsy will appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {autopsies.map((a) => (
              <div key={a.id} className="neu-raised-sm rounded-xl p-3">
                <div className="text-[11px] text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString()}
                </div>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{a.output}</p>
              </div>
            ))}
          </div>
        )}
      </NeuCard>
    </div>
  );
}

function ToolCard({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`accent-strip-${accent} bg-background rounded-2xl p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function BriefingTool({ leads }: { leads: Lead[] }) {
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const summary = leads
        .slice(0, 30)
        .map((l) => `${l.name} — ${l.stage}, silent ${daysSilent(l.last_contact) ?? "?"}d`)
        .join("\n");
      const r = await supabase.functions.invoke("ai-task", {
        body: { task: "briefing", payload: { leads_summary: summary } },
      });
      setOut(r.data?.output ?? "Failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <ToolCard icon={Brain} title="Daily Briefing" accent="purple">
      <NeuButton size="sm" onClick={run} disabled={busy} className="mb-3">
        <RefreshCw className={`h-3 w-3 inline mr-1 ${busy ? "animate-spin" : ""}`} />
        Generate
      </NeuButton>
      {out && <p className="text-sm text-foreground whitespace-pre-wrap">{out}</p>}
    </ToolCard>
  );
}

function ReplyAnalyzer() {
  const [text, setText] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const r = await supabase.functions.invoke("ai-task", {
        body: { task: "reply_analysis", payload: { text } },
      });
      setOut(r.data?.output ?? "Failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <ToolCard icon={MessageSquare} title="Reply Analyzer" accent="blue">
      <NeuTextarea
        rows={3}
        placeholder="Paste their reply here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <NeuButton
        size="sm"
        variant="primary"
        onClick={run}
        disabled={busy || !text}
        className="mt-2"
      >
        {busy ? "..." : "Analyze"}
      </NeuButton>
      {out && <p className="text-sm text-foreground whitespace-pre-wrap mt-3">{out}</p>}
    </ToolCard>
  );
}

function IcpScorer({ userId }: { userId?: string }) {
  const [text, setText] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("icp_text")
        .eq("id", userId)
        .single();
      const r = await supabase.functions.invoke("ai-task", {
        body: { task: "icp_score", payload: { lead_text: text, user_icp: prof?.icp_text ?? "" } },
      });
      setOut(r.data?.output ?? "Failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <ToolCard icon={Search} title="ICP Scorer" accent="green">
      <NeuTextarea
        rows={3}
        placeholder="Paste a LinkedIn URL, bio, or company description..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <NeuButton
        size="sm"
        variant="primary"
        onClick={run}
        disabled={busy || !text}
        className="mt-2"
      >
        {busy ? "..." : "Score"}
      </NeuButton>
      {out && <p className="text-sm text-foreground whitespace-pre-wrap mt-3">{out}</p>}
    </ToolCard>
  );
}

function RecapTool({ leads }: { leads: Lead[] }) {
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const weekAgo = Date.now() - 7 * 86400000;
      const recent = leads.filter((l) => new Date(l.updated_at).getTime() > weekAgo);
      const summary = recent.map((l) => `${l.name} (${l.stage}) — $${l.deal_value}`).join("\n");
      const r = await supabase.functions.invoke("ai-task", {
        body: { task: "recap", payload: { leads_summary: summary } },
      });
      setOut(r.data?.output ?? "Failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <ToolCard icon={Calendar} title="Weekly Recap" accent="amber">
      <NeuButton size="sm" onClick={run} disabled={busy} className="mb-3">
        {busy ? "..." : "Generate this week"}
      </NeuButton>
      {out && <p className="text-sm text-foreground whitespace-pre-wrap">{out}</p>}
    </ToolCard>
  );
}
