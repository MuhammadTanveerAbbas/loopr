import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLeads, useHardDeleteLead, type Lead } from "@/lib/leads-api";
import { NeuCard, NeuButton } from "@/components/ui/neu";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
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
  const hardDelete = useHardDeleteLead();
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

  const getDaysUntilPurge = (deletedAt: string | null) => {
    if (!deletedAt) return null;
    const daysSince = Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000);
    return 30 - daysSince;
  };

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
          <div className="text-center py-12">
            <p className="text-sm font-medium text-muted-foreground">Trash is empty.</p>
            <p className="text-xs text-muted-foreground mt-1">Deleted leads will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deleted.map((l: Lead) => {
              const daysLeft = getDaysUntilPurge(l.deleted_at);
              return (
                <div
                  key={l.id}
                  className="neu-raised-sm rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{l.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>
                        {l.company || "No company"} · {l.stage}
                      </span>
                      {daysLeft !== null && (
                        <span className="text-amber-600 font-semibold">
                          {daysLeft > 0 ? `Auto-purge in ${daysLeft}d` : "Pending purge"}
                        </span>
                      )}
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
                  hardDelete.mutate(permDeleteTarget.id);
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
