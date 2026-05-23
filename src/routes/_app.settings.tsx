import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NeuCard, NeuButton, NeuInput, NeuTextarea } from "@/components/ui/neu";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
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
      else toast.success("Saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Customize how the AI thinks about your pipeline.
        </p>
      </header>

      <NeuCard className="rounded-2xl space-y-4">
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
              <span className="mt-1.5 text-[11px] font-semibold text-green-600 whitespace-nowrap">
                Verified
              </span>
            ) : (
              <span className="mt-1.5 text-[11px] font-semibold text-amber-600 whitespace-nowrap">
                Not verified
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
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Used by AI tools to score leads and write outreach.
          </p>
        </div>
        <NeuButton variant="primary" onClick={save} disabled={busy}>
          {busy ? "Saving..." : "Save changes"}
        </NeuButton>
      </NeuCard>

      <NeuCard className="rounded-2xl">
        <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
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
