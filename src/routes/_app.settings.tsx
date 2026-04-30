import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NeuCard, NeuButton, NeuInput, NeuTextarea } from "@/components/ui/neu";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Loopr" }] }),
  component: Settings,
});

function Settings() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [icp, setIcp] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name ?? "");
          setIcp(data.icp_text ?? "");
        }
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, name, icp_text: icp, email: user.email });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Saved");
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
          <NeuInput value={user?.email ?? ""} disabled className="mt-1.5 opacity-60" />
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
        <NeuButton onClick={signOut} className="mt-3 text-destructive">
          Sign out
        </NeuButton>
      </NeuCard>
    </div>
  );
}
