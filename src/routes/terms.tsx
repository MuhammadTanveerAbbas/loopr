import { createFileRoute, Link } from "@tanstack/react-router";
import { LoopMark } from "@/components/ui/logo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service  Loopr" },
      { name: "description", content: "Loopr terms of service." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
              Terms of Service
            </div>
          </div>
        </div>
        <div className="brutal-card p-8 md:p-10 space-y-6 text-foreground/80 text-sm font-medium leading-relaxed">
          <h1 className="text-3xl font-extrabold text-foreground">Terms of Service</h1>
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
            Last updated: May 2026
          </p>

          <Section title="Acceptance">
            By using Loopr, you agree to these terms. If you do not agree, do not use the service.
          </Section>

          <Section title="Account responsibility">
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activity under your account.
          </Section>

          <Section title="Acceptable use">
            Loopr is designed for high-touch outbound sales pipelines. You may not use the service
            for spam, mass email campaigns, or any illegal activity.
          </Section>

          <Section title="Service availability">
            We strive for high uptime but do not guarantee uninterrupted service. We reserve the
            right to modify or discontinue features with reasonable notice.
          </Section>

          <Section title="Limitation of liability">
            Loopr is provided "as is." We are not liable for any damages arising from your use of
            the service. Your sole remedy is to stop using the service.
          </Section>

          <Section title="Changes">
            We may update these terms. Continued use after changes constitutes acceptance of the new
            terms.
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
