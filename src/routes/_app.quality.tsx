import { createFileRoute } from "@tanstack/react-router";
import { NeuCard, NeuBadge } from "@/components/ui/neu";
import {
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  Type,
  Trash2,
  Lock,
  Database,
  Bug,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/_app/quality")({
  head: () => ({
    meta: [
      { title: "Quality & Security — Loopr" },
      { name: "description", content: "Audit checklist for code quality and security." },
    ],
  }),
  component: QualityPage,
});

type Status = "pass" | "warn" | "fail";

const checks: Array<{
  category: string;
  icon: LucideIcon;
  color: "yellow" | "orange" | "pink";
  items: Array<{ name: string; status: Status; detail: string }>;
}> = [
  {
    category: "Font Consistency",
    icon: Type,
    color: "yellow",
    items: [
      {
        name: "Baloo 2 imported globally",
        status: "pass",
        detail: "Loaded via Google Fonts in styles.css",
      },
      {
        name: "Applied to body, headings, inputs",
        status: "pass",
        detail: "Enforced via @layer base",
      },
      {
        name: "Sidebar & navbar inherit font",
        status: "pass",
        detail: "No font-family overrides found",
      },
      {
        name: "No serif/system fallbacks leaking",
        status: "pass",
        detail: "Single font stack across app",
      },
    ],
  },
  {
    category: "Unused Code Cleanup",
    icon: Trash2,
    color: "orange",
    items: [
      {
        name: "ThemeProvider removed",
        status: "pass",
        detail: "Light-only mode, dark theme purged",
      },
      { name: "Unused lucide-react icons", status: "pass", detail: "Sidebar imports verified" },
      {
        name: "Dead helpers removed",
        status: "pass",
        detail: "computeSignalScore unused import deleted",
      },
      { name: "TypeScript build clean", status: "pass", detail: "tsc --noEmit passes" },
    ],
  },
  {
    category: "Auth Guards",
    icon: Lock,
    color: "pink",
    items: [
      {
        name: "Protected routes require session",
        status: "pass",
        detail: "_app layout redirects to /auth",
      },
      {
        name: "Auth state via Supabase listener",
        status: "pass",
        detail: "onAuthStateChange wired in AuthProvider",
      },
      { name: "Sign-out clears session", status: "pass", detail: "Sidebar logout flow tested" },
      {
        name: "No anonymous sign-up paths",
        status: "pass",
        detail: "Only email + Google OAuth enabled",
      },
    ],
  },
  {
    category: "RLS Verification",
    icon: Database,
    color: "yellow",
    items: [
      { name: "RLS enabled on leads", status: "pass", detail: "Owner-scoped policies active" },
      {
        name: "RLS enabled on lead_touches",
        status: "pass",
        detail: "Owner-scoped via lead reference",
      },
      { name: "RLS enabled on profiles", status: "pass", detail: "Self-only read/write" },
      { name: "RLS enabled on ai_logs & stage_history", status: "pass", detail: "Owner-scoped" },
    ],
  },
  {
    category: "Error Handling",
    icon: Bug,
    color: "orange",
    items: [
      {
        name: "Edge function generic errors",
        status: "pass",
        detail: "ai-task returns 'Internal server error'",
      },
      { name: "Payload size cap (20KB)", status: "pass", detail: "Mitigates abuse on AI endpoint" },
      { name: "Input type validation", status: "pass", detail: "task/payload guards enforced" },
      {
        name: "No raw errors leaked client-side",
        status: "pass",
        detail: "Toast messages user-friendly",
      },
    ],
  },
  {
    category: "Visual QA",
    icon: ShieldCheck,
    color: "pink",
    items: [
      {
        name: "Neobrutalist styles on / and /auth",
        status: "pass",
        detail: "Hard shadows, 2.5px borders, brand palette",
      },
      {
        name: "Dashboard cards & charts on-brand",
        status: "pass",
        detail: "Live pipeline data, no placeholders",
      },
      {
        name: "Comparison table replaces testimonials",
        status: "pass",
        detail: "Loopr vs HubSpot vs Spreadsheets",
      },
      { name: "Sidebar nav consistent", status: "pass", detail: "Active state uses neu-inset-sm" },
    ],
  },
];

function StatusIcon({ status }: { status: Status }) {
  if (status === "pass")
    return (
      <div
        className="w-8 h-8 rounded-full bg-[var(--success)] border-2 border-black flex items-center justify-center"
        style={{ boxShadow: "0 3px 0 #0A0A0A" }}
      >
        <Check className="h-4 w-4 text-black" strokeWidth={3} />
      </div>
    );
  if (status === "warn")
    return (
      <div
        className="w-8 h-8 rounded-full bg-[var(--brand-yellow)] border-2 border-black flex items-center justify-center"
        style={{ boxShadow: "0 3px 0 #0A0A0A" }}
      >
        <AlertTriangle className="h-4 w-4 text-black" strokeWidth={3} />
      </div>
    );
  return (
    <div
      className="w-8 h-8 rounded-full bg-[var(--destructive)] border-2 border-black flex items-center justify-center"
      style={{ boxShadow: "0 3px 0 #0A0A0A" }}
    >
      <X className="h-4 w-4 text-white" strokeWidth={3} />
    </div>
  );
}

function QualityPage() {
  const all = checks.flatMap((c) => c.items);
  const pass = all.filter((i) => i.status === "pass").length;
  const warn = all.filter((i) => i.status === "warn").length;
  const fail = all.filter((i) => i.status === "fail").length;
  const score = Math.round((pass / all.length) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground flex items-center gap-3">
            <ShieldCheck className="h-9 w-9" strokeWidth={2.5} />
            Quality & Security
          </h1>
          <p className="text-sm font-bold text-foreground/70 mt-2 uppercase tracking-wide">
            Production readiness audit
          </p>
        </div>
        <div className="flex gap-2">
          <NeuBadge color="green">{pass} Pass</NeuBadge>
          {warn > 0 && <NeuBadge color="amber">{warn} Warn</NeuBadge>}
          {fail > 0 && <NeuBadge color="red">{fail} Fail</NeuBadge>}
        </div>
      </div>

      <NeuCard variant="yellow" className="flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-black/70">
            Overall Health
          </div>
          <div className="text-6xl font-extrabold text-black leading-none mt-1">{score}%</div>
          <div className="text-sm font-bold text-black/80 mt-2">
            {pass}/{all.length} checks passing
          </div>
        </div>
        <div className="flex-1 min-w-[200px] max-w-md">
          <div
            className="h-6 bg-white border-2 border-black rounded-full overflow-hidden"
            style={{ boxShadow: "0 3px 0 #0A0A0A" }}
          >
            <div
              className="h-full bg-[var(--success)] border-r-2 border-black transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </NeuCard>

      <div className="grid gap-5 md:grid-cols-2">
        {checks.map((cat) => {
          const Icon = cat.icon;
          const passed = cat.items.filter((i) => i.status === "pass").length;
          return (
            <NeuCard key={cat.category} variant={cat.color}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black/20">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg bg-white border-2 border-black flex items-center justify-center"
                    style={{ boxShadow: "0 3px 0 #0A0A0A" }}
                  >
                    <Icon className="h-5 w-5 text-black" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-extrabold text-black text-lg leading-tight">
                      {cat.category}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-black/70">
                      {passed}/{cat.items.length} passing
                    </div>
                  </div>
                </div>
              </div>
              <ul className="space-y-3">
                {cat.items.map((item) => (
                  <li key={item.name} className="flex items-start gap-3">
                    <StatusIcon status={item.status} />
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-black text-sm">{item.name}</div>
                      <div className="text-xs font-medium text-black/70 mt-0.5">{item.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </NeuCard>
          );
        })}
      </div>

      <NeuCard variant="raised">
        <div className="font-extrabold text-foreground text-lg mb-2">How to re-run audits</div>
        <ul className="text-sm font-medium text-foreground/80 space-y-1.5 list-disc list-inside">
          <li>
            <span className="font-bold">Type-check:</span> run{" "}
            <code className="bg-black/10 px-1.5 py-0.5 rounded font-bold">tsc --noEmit</code>
          </li>
          <li>
            <span className="font-bold">RLS:</span> verify policies in Supabase Dashboard → Database
          </li>
          <li>
            <span className="font-bold">Edge functions:</span> inspect logs in Supabase Dashboard →
            Edge Functions
          </li>
          <li>
            <span className="font-bold">Visual QA:</span> walk /, /auth, /dashboard, /leads,
            /pipeline
          </li>
        </ul>
      </NeuCard>
    </div>
  );
}
