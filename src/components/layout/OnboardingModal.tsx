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
import { ArrowRight, Table2, Brain, Sparkles, type LucideIcon } from "lucide-react";
import { useLeads } from "@/lib/leads-api";

const ONBOARDING_KEY = "loopr_onboarding_done";

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

  const steps = [
    {
      title: "Welcome to Loopr",
      description: "Your focused CRM for high-touch outbound. Let's get you set up in 30 seconds.",
      icon: Sparkles,
    },
    {
      title: "Add your first lead",
      description:
        "Click 'Add Lead' on the Leads page to start tracking your pipeline. You can edit everything inline.",
      icon: Table2,
      action: () => {
        finish();
        nav({ to: "/leads" });
      },
    },
    {
      title: "Try the AI tools",
      description:
        "Visit the AI Workspace for daily briefings, reply analysis, and ICP scoring. Press Cmd+K anytime to search.",
      icon: Brain,
      action: () => {
        finish();
        nav({ to: "/ai" });
      },
    },
  ];

  const s = step >= 0 && step < steps.length ? steps[step]! : null;
  if (!s) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) finish();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <s.icon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{s.title}</DialogTitle>
          <DialogDescription className="text-center">{s.description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === step ? "bg-foreground" : "bg-foreground/20"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step < steps.length - 1 ? (
              <>
                <NeuButton variant="ghost" size="sm" onClick={finish}>
                  Skip
                </NeuButton>
                <NeuButton size="sm" onClick={() => setStep(step + 1)}>
                  Next <ArrowRight className="h-3 w-3 ml-1" />
                </NeuButton>
              </>
            ) : (
              <NeuButton variant="primary" size="sm" onClick={finish}>
                Get started
              </NeuButton>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
