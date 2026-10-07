import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NeuButton } from "@/components/ui/neu";
import { ArrowRight, Table2, Brain, Sparkles } from "lucide-react";
import { useLeads } from "@/lib/leads-api";
import { LoopMark } from "@/components/ui/logo";

const ONBOARDING_KEY = "loopr_onboarding_done";

const steps = [
  {
    title: "Welcome to Loopr",
    description: "Your focused CRM for high-touch outbound. Let's get you set up in 30 seconds.",
    icon: Sparkles,
    badge: "Step 1 of 3",
    cta: null,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Add your first lead",
    description:
      "Click 'Add Lead' on the Leads page to start tracking your pipeline. Edit everything inline — no forms, no friction.",
    icon: Table2,
    badge: "Step 2 of 3",
    cta: { label: "Go to Leads", to: "/leads" as const },
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    title: "Try the AI tools",
    description:
      "Get daily briefings, analyze replies, and score leads with AI. Press Cmd+K anytime to search your pipeline.",
    icon: Brain,
    badge: "Step 3 of 3",
    cta: { label: "Open AI Workspace", to: "/ai" as const },
    color: "bg-violet-500/10 text-violet-600",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const nav = useNavigate();
  const { data } = useLeads();
  const hasLeads = (data?.leads?.length ?? 0) > 0;

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done && !hasLeads) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasLeads]);

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  const s = steps[step]!;
  const Icon = s.icon;
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) finish(); }}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl p-0 overflow-hidden rounded-2xl sm:rounded-3xl gap-0">
        <div className="p-6 sm:p-8">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <LoopMark size={36} />
              <div className="leading-none">
                <div className="font-extrabold text-base text-foreground">Loopr</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Focused CRM
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full shrink-0">
              {s.badge}
            </span>
          </div>

          {/* Step cards row — all 3 visible on md+ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {steps.map((st, i) => {
              const StIcon = st.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                    isActive
                      ? "border-foreground bg-foreground/5 shadow-sm"
                      : isDone
                        ? "border-foreground/20 bg-foreground/[0.02] opacity-70"
                        : "border-border bg-transparent opacity-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${st.color}`}>
                    <StIcon className="h-4 w-4" />
                  </div>
                  <div className="font-semibold text-sm text-foreground leading-snug">{st.title}</div>
                  {isActive && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                      {st.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active step detail (mobile fallback) */}
          <div className="sm:hidden mb-6">
            <DialogHeader>
              <DialogTitle className="text-lg">{s.title}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">{s.description}</DialogDescription>
            </DialogHeader>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={`rounded-full transition-all duration-200 ${
                    i === step ? "w-5 h-2 bg-foreground" : "w-2 h-2 bg-foreground/20 hover:bg-foreground/40"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <NeuButton variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">
                Skip
              </NeuButton>
              {isLast ? (
                <NeuButton
                  variant="primary"
                  size="sm"
                  onClick={s.cta ? () => { finish(); nav({ to: s.cta!.to }); } : finish}
                >
                  {s.cta?.label ?? "Get started"}
                </NeuButton>
              ) : (
                <>
                  {s.cta && (
                    <NeuButton
                      variant="ghost"
                      size="sm"
                      onClick={() => { finish(); nav({ to: s.cta!.to }); }}
                    >
                      {s.cta.label}
                    </NeuButton>
                  )}
                  <NeuButton size="sm" onClick={() => setStep(step + 1)}>
                    Next <ArrowRight className="h-3 w-3 ml-1" />
                  </NeuButton>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
