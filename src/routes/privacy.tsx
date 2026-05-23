import { createFileRoute, Link } from "@tanstack/react-router";
import { LoopMark } from "@/components/ui/logo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy  Loopr" },
      { name: "description", content: "Loopr privacy policy — how we handle your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
              Privacy Policy
            </div>
          </div>
        </div>
        <div className="brutal-card p-8 md:p-10 space-y-6 text-foreground/80 text-sm font-medium leading-relaxed">
          <h1 className="text-3xl font-extrabold text-foreground">Privacy Policy</h1>
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
            Last updated: May 2026
          </p>

          <Section title="What we collect">
            We collect only the data you provide: name, email address, and the lead & pipeline
            information you enter into the app. We use Supabase for authentication and storage.
          </Section>

          <Section title="How we use it">
            Your data is used solely to power the CRM functionality — displaying your leads,
            generating AI briefings, and syncing across sessions. We never sell your data.
          </Section>

          <Section title="AI data handling">
            AI briefings are generated via Supabase Edge Functions. Your lead data is sent to an LLM
            only for the purpose of generating summaries and recommendations. We do not train models
            on your data.
          </Section>

          <Section title="Data retention">
            You can delete any lead or your entire account at any time. Account deletion removes all
            associated data within 30 days.
          </Section>

          <Section title="Third-party services">
            We use Supabase (auth, database, edge functions) and Google OAuth (optional sign-in).
            Each service has its own privacy policy.
          </Section>

          <Section title="Contact">
            For privacy-related questions, reach out via the support channels listed on our site.
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
