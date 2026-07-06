import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NeuCard, NeuButton, NeuInput, NeuTextarea } from "@/components/ui/neu";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings  Loopr" }] }),
  component: Settings,
});

function Settings() {
  const { user, signOut, deleteAccount } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [icp, setIcp] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setName(data.name ?? "");
        setIcp(data.icp_text ?? "");
      }
    })().catch(() => toast.error("Failed to load profile"));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, name, icp_text: icp });
      if (error) toast.error(error.message);
      else {
        toast.success("Settings saved");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-up">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Customize how the AI thinks about your pipeline.
        </p>
      </header>

      <NeuCard className="rounded-2xl space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b-2 border-black">
          <div className="w-14 h-14 rounded-full bg-foreground/10 border-3 border-black flex items-center justify-center text-xl font-extrabold shrink-0">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <div className="font-bold text-foreground">{name || "User"}</div>
            <div className="text-xs text-muted-foreground">{user?.email || ""}</div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Name
          </label>
          <NeuInput value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Email
          </label>
          <div className="flex items-center gap-2">
            <NeuInput value={user?.email ?? ""} disabled className="mt-1.5 opacity-60 flex-1" />
            {user?.email_confirmed_at ? (
              <span className="mt-1.5 text-[11px] font-semibold text-green-600 whitespace-nowrap flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="mt-1.5 text-[11px] font-semibold text-amber-600 whitespace-nowrap flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Not verified
              </span>
            )}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your ICP (Ideal Customer Profile)
          </label>
          <NeuTextarea
            rows={4}
            value={icp}
            onChange={(e) => setIcp(e.target.value)}
            placeholder="My ideal client is a SaaS founder with 10–50 employees, raising Series A..."
            className="mt-1.5"
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-muted-foreground">
              Used by AI tools to score leads and write outreach.
            </p>
            <span className="text-[10px] text-muted-foreground">{icp.length} chars</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NeuButton variant="primary" onClick={save} disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </NeuButton>
          {saved && (
            <span className="text-xs font-semibold text-green-600 animate-fade-up flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </span>
          )}
        </div>
      </NeuCard>

      <NeuCard className="rounded-2xl">
        <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Danger zone
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Sign out of this device.</p>
        <div className="flex gap-2 mt-3">
          <NeuButton onClick={signOut} className="text-destructive">
            Sign out
          </NeuButton>
          <NeuButton onClick={() => setDeleteOpen(true)} className="text-destructive">
            Delete account
          </NeuButton>
        </div>
      </NeuCard>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your leads, settings, and data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteBusy}
              onClick={async () => {
                setDeleteBusy(true);
                try {
                  await deleteAccount();
                  toast.success("Account deleted.");
                  nav({ to: "/" });
                } catch {
                  toast.error("Failed to delete account. Contact support.");
                } finally {
                  setDeleteBusy(false);
                  setDeleteOpen(false);
                }
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteBusy ? "Deleting..." : "Delete forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
