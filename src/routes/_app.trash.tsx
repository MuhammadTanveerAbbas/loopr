import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLeads, useUpdateLead, useDeleteLead, type Lead } from "@/lib/leads-api";
import { NeuCard, NeuButton, NeuBadge } from "@/components/ui/neu";
import { Skeleton } from "@/components/ui/skeleton";
import { daysSilent, scoreColor } from "@/lib/signal-score";
import { Trash2, RotateCcw } from "lucide-react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/trash")({
  head: () => ({
    meta: [
      { title: "Trash  Loopr" },
      {
        name: "description",
        content:
          "View and restore soft-deleted leads. Leads are permanently removed after 30 days.",
      },
    ],
  }),
  component: TrashPage,
});

function TrashPage() {
  const { data, isLoading } = useLeads({ includeDeleted: true });
  const leads = data?.leads ?? [];
  const deleted = leads.filter((l: Lead) => l.deleted_at);
  const qc = useQueryClient();
  const del = useDeleteLead();
  const [permDeleteTarget, setPermDeleteTarget] = useState<Lead | null>(null);

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("restore_lead", { lead_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead restored");
    },
    onError: () => toast.error("Failed to restore"),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 p-6">
        <Skeleton className="h-8 w-24" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="neu-raised p-4 rounded-xl">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Trash</h1>
        <p className="text-sm text-muted-foreground">
          Deleted leads are kept for 30 days before permanent removal.
        </p>
      </header>

      <NeuCard className="rounded-2xl">
        {deleted.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">Trash is empty.</p>
        ) : (
          <div className="space-y-2">
            {deleted.map((l: Lead) => {
              const ds = daysSilent(l.last_contact);
              const sc = scoreColor(l.signal_score);
              return (
                <div
                  key={l.id}
                  className="neu-raised-sm rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{l.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.company || "No company"} · {l.stage} · Deleted{" "}
                      {l.deleted_at ? new Date(l.deleted_at).toLocaleDateString() : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <NeuButton
                      size="sm"
                      onClick={() => restore.mutate(l.id)}
                      disabled={restore.isPending}
                    >
                      <RotateCcw className="h-3 w-3 mr-1 inline" />
                      Restore
                    </NeuButton>
                    <button
                      onClick={() => setPermDeleteTarget(l)}
                      className="neu-pressable rounded-xl p-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </NeuCard>

      <AlertDialog
        open={!!permDeleteTarget}
        onOpenChange={(open) => !open && setPermDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The lead will be permanently removed from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (permDeleteTarget) {
                  del.mutate(permDeleteTarget.id);
                  setPermDeleteTarget(null);
                  toast.success("Lead permanently deleted");
                }
              }}
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
