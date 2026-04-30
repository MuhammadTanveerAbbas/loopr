import { useState } from "react";
import { type Lead, useUpdateLead, useTouches, useAddTouch, STAGES } from "@/lib/leads-api";
import { NeuButton, NeuInput, NeuTextarea, NeuSelect, NeuBadge } from "@/components/ui/neu";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus, Mail, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { scoreColor } from "@/lib/signal-score";

export function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { user } = useAuth();
  const update = useUpdateLead();
  const { data: touches = [] } = useTouches(lead.id);
  const addTouch = useAddTouch();
  const [newTouchType, setNewTouchType] = useState("note");
  const [newTouchNote, setNewTouchNote] = useState("");
  const [draftBusy, setDraftBusy] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const sc = scoreColor(lead.signal_score);

  const log = async () => {
    if (!user || !newTouchNote.trim()) return;
    await addTouch.mutateAsync({
      lead_id: lead.id,
      user_id: user.id,
      type: newTouchType,
      note: newTouchNote,
      sentiment: newTouchType === "reply_received" ? "neutral" : null,
    });
    setNewTouchNote("");
    toast.success("Logged");
  };

  const generateDraft = async () => {
    setDraftBusy(true);
    try {
      const lastNote = touches.find((t) => t.note)?.note ?? "";
      const { data: prof } = await supabase
        .from("profiles")
        .select("icp_text")
        .eq("id", user!.id)
        .single();
      const res = await supabase.functions.invoke("ai-task", {
        body: {
          task: "email_draft",
          payload: {
            name: lead.name,
            company: lead.company,
            niche: lead.niche,
            stage: lead.stage,
            last_note: lastNote,
            user_icp: prof?.icp_text ?? "",
          },
        },
      });
      if (res.error) throw res.error;
      setDraft(res.data?.output ?? "");
    } catch {
      toast.error("Couldn't generate draft");
    } finally {
      setDraftBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-background h-full overflow-y-auto p-6 neu-raised-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0">
            <input
              defaultValue={lead.name}
              onBlur={(e) =>
                e.target.value !== lead.name &&
                update.mutate({ id: lead.id, patch: { name: e.target.value } })
              }
              className="text-xl font-bold text-foreground bg-transparent w-full outline-none"
            />
            <input
              defaultValue={lead.company ?? ""}
              onBlur={(e) => update.mutate({ id: lead.id, patch: { company: e.target.value } })}
              placeholder="Company"
              className="text-sm text-muted-foreground bg-transparent w-full outline-none mt-0.5"
            />
          </div>
          <button onClick={onClose} className="neu-pressable rounded-xl p-2 ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <NeuBadge color={sc === "red" ? "red" : sc === "amber" ? "amber" : "green"}>
            Signal {lead.signal_score}
          </NeuBadge>
          <NeuSelect
            value={lead.stage}
            onChange={(e) =>
              update.mutate({
                id: lead.id,
                patch: { stage: e.target.value, stage_changed_at: new Date().toISOString() },
              })
            }
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NeuSelect>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Deal Value
            </label>
            <NeuInput
              type="number"
              defaultValue={Number(lead.deal_value)}
              onBlur={(e) =>
                update.mutate({ id: lead.id, patch: { deal_value: Number(e.target.value) } })
              }
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Niche
            </label>
            <NeuInput
              defaultValue={lead.niche ?? ""}
              onBlur={(e) => update.mutate({ id: lead.id, patch: { niche: e.target.value } })}
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Notes
            </label>
            <NeuTextarea
              rows={4}
              defaultValue={lead.notes ?? ""}
              onBlur={(e) => update.mutate({ id: lead.id, patch: { notes: e.target.value } })}
              className="mt-1.5"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                AI Email Draft
              </label>
              <NeuButton size="sm" onClick={generateDraft} disabled={draftBusy}>
                <Sparkles className="h-3 w-3 mr-1 inline" />
                {draftBusy ? "..." : "Draft"}
              </NeuButton>
            </div>
            {draft && (
              <div className="neu-inset rounded-xl p-3 text-sm text-foreground whitespace-pre-wrap relative">
                {draft}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(draft);
                    toast.success("Copied");
                  }}
                  className="absolute top-2 right-2 neu-pressable rounded-lg p-1.5"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
              Log a contact
            </label>
            <div className="flex gap-2 mb-2">
              <NeuSelect
                value={newTouchType}
                onChange={(e) => setNewTouchType(e.target.value)}
                className="text-xs"
              >
                <option value="note">Note</option>
                <option value="email_sent">Email sent</option>
                <option value="reply_received">Reply received</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
              </NeuSelect>
              <NeuButton size="sm" variant="primary" onClick={log}>
                <Plus className="h-3 w-3 inline" />
              </NeuButton>
            </div>
            <NeuTextarea
              rows={2}
              placeholder="What happened?"
              value={newTouchNote}
              onChange={(e) => setNewTouchNote(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Timeline
            </label>
            <div className="space-y-2 mt-2">
              {touches.length === 0 && (
                <p className="text-xs text-muted-foreground">No touches logged yet.</p>
              )}
              {touches.map((t) => (
                <div key={t.id} className="neu-raised-sm rounded-xl px-3 py-2.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider">
                      {t.type.replace("_", " ")}
                    </span>
                    <span>{new Date(t.touched_at).toLocaleDateString()}</span>
                  </div>
                  {t.note && <p className="text-sm text-foreground mt-1">{t.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
