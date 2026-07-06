import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { NeuButton, NeuCard, NeuInput } from "@/components/ui/neu";
import { GoogleIcon } from "@/components/ui/google-icon";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/lib/error-service";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { LoopMark } from "@/components/ui/logo";

const authFormSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(100).optional(),
});

type AuthForm = z.infer<typeof authFormSchema>;

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in - Loopr" },
      { name: "description", content: "Sign in or create an account for Loopr by The MVP Guy." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AuthForm>({
    resolver: zodResolver(authFormSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  const watchedEmail = watch("email");
  const watchedPassword = watch("password");
  const hasValues = mode === "reset" ? !!watchedEmail : !!watchedEmail && !!watchedPassword;

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  const submit = async (data: AuthForm) => {
    setBusy(true);
    try {
      if (mode === "reset") {
        const redirectOrigin = import.meta.env.VITE_PUBLIC_ORIGIN || window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${redirectOrigin}/auth`,
        });
        if (error) throw error;
        toast.success("Check your email for the reset link.");
        setMode("login");
        return;
      }
      if (mode === "signup") {
        const { error, data: signupData } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { name: data.name },
          },
        });
        if (error) throw error;
        if (signupData?.user?.identities?.length === 0) {
          toast.error("An account with this email already exists.");
          return;
        }
        toast.success("Account created. Check your email to confirm your sign-up.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err) {
      toast.error(sanitizeErrorMessage(err, "Authentication failed. Please try again."));
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
        toast.error(sanitizeErrorMessage(error, "Google sign-in failed. Please try again."));
        setGoogleBusy(false);
      }
    } catch (err) {
      toast.error(sanitizeErrorMessage(err, "Google sign-in failed. Please try again."));
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
        <LoopMark size={44} className="transition-transform group-hover:-rotate-6" />
        <div className="leading-none">
          <div className="font-extrabold text-xl text-foreground">Loopr</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 mt-1">
            by The MVP Guy
          </div>
        </div>
      </Link>

      <NeuCard variant="lg" className="w-full max-w-md rounded-3xl p-8 z-10 animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">
          {mode === "login"
            ? "Welcome back"
            : mode === "reset"
              ? "Reset your password"
              : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "login"
            ? "Sign in to your pipeline."
            : mode === "reset"
              ? "We'll send you a reset link."
              : "Start tracking in under a minute."}
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

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
          {mode === "signup" && (
            <div>
              <NeuInput
                placeholder="Your name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-xs font-semibold text-destructive">{errors.name.message}</p>
              )}
            </div>
          )}
          <div>
            <NeuInput
              type="email"
              placeholder="you@company.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-xs font-semibold text-destructive">{errors.email.message}</p>
            )}
          </div>
          {mode !== "reset" && (
            <div>
              <div className="relative">
                <NeuInput
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  {...register("password")}
                  aria-invalid={!!errors.password}
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
              {errors.password && (
                <p className="mt-1 text-xs font-semibold text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}
          {mode === "login" && (
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="text-xs text-muted-foreground hover:text-foreground self-end -mt-2"
            >
              Forgot password?
            </button>
          )}
          <NeuButton type="submit" variant="primary" disabled={busy || !hasValues} className="mt-2">
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Working…
              </span>
            ) : mode === "reset" ? (
              "Send reset link"
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </NeuButton>
        </form>

        <button
          type="button"
          onClick={() =>
            setMode(mode === "login" ? "signup" : mode === "reset" ? "login" : "login")
          }
          className="mt-6 text-sm text-muted-foreground hover:text-foreground w-full text-center"
        >
          {mode === "login"
            ? "No account? Create one"
            : mode === "reset"
              ? "Back to sign in"
              : "Already have an account? Sign in"}
        </button>
      </NeuCard>
    </main>
  );
}
