import { createFileRoute, Link } from "@tanstack/react-router";
import { LoopMark } from "@/components/ui/logo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security  Loopr" },
      { name: "description", content: "Loopr security practices and compliance." },
    ],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <main className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="flex items-center gap-3 mb-10">
          <LoopMark size={40} />
          <div className="leading-none">
            <div className="font-extrabold text-xl text-foreground">Loopr</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 mt-1">
              Security
            </div>
          </div>
        </div>
        <div className="brutal-card p-8 md:p-10 space-y-6 text-foreground/80 text-sm font-medium leading-relaxed">
          <h1 className="text-3xl font-extrabold text-foreground">Security</h1>
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
            Last updated: May 2026
          </p>

          <Section title="Data encryption">
            All data in transit is encrypted via TLS 1.3. Data at rest is encrypted using AES-256
            through Supabase's infrastructure.
          </Section>

          <Section title="Authentication">
            Authentication is handled by Supabase Auth with email/password and optional Google
            OAuth. Row-level security ensures users can only access their own data.
          </Section>

          <Section title="Infrastructure">
            Loopr runs on Supabase (PostgreSQL, edge functions). Supabase follows industry-standard
            security practices.
          </Section>

          <Section title="AI privacy">
            Lead data sent to AI models for briefing generation is not stored or used for training.
            Edge functions process data ephemerally.
          </Section>

          <Section title="Vulnerability reporting">
            If you discover a security issue, please report it via the contact channels on our site.
            We take all reports seriously.
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-extrabold text-foreground mb-2">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
