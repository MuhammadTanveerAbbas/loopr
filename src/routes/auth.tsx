import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { NeuButton, NeuCard, NeuInput } from "@/components/ui/neu";
import { GoogleIcon } from "@/components/ui/google-icon";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { LoopMark } from "@/components/ui/logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Loopr" },
      { name: "description", content: "Sign in or create an account for Loopr by The MVP Guy." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { name } },
        });
        if (error) throw error;
        toast.success("Account created. Welcome!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        toast.error(error.message ?? "Google sign-in failed");
        setGoogleBusy(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(message);
      setGoogleBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative orbs */}
      <div
        aria-hidden
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[oklch(0.65_0.18_295)]/10 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <Link to="/" className="flex items-center gap-3 mb-8 z-10 group">
        <LoopMark size={44} className="transition-transform group-hover:rotate-[-6deg]" />
        <div className="leading-none">
          <div className="font-extrabold text-xl text-foreground">Loopr</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 mt-1">
            by The MVP Guy
          </div>
        </div>
      </Link>

      <NeuCard variant="lg" className="w-full max-w-md rounded-3xl p-8 z-10 animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "login" ? "Sign in to your pipeline." : "Start tracking in under a minute."}
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleBusy}
          className="mt-6 w-full neu-pressable rounded-xl px-4 py-3 text-sm font-semibold text-foreground inline-flex items-center justify-center gap-3 disabled:opacity-60"
        >
          {googleBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-muted-foreground/15" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            or with email
          </span>
          <div className="flex-1 h-px bg-muted-foreground/15" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <NeuInput
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <NeuInput
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <NeuInput
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="pr-12"
            />
            <button
              type="button"
              aria-label={showPw ? "Hide password" : "Show password"}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <NeuButton type="submit" variant="primary" disabled={busy} className="mt-2">
            {busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </NeuButton>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground w-full text-center"
        >
          {mode === "login" ? "No account? Create one" : "Already have an account? Sign in"}
        </button>
      </NeuCard>
    </main>
  );
}
