import { useState } from "react";
import {
  type Lead,
  useUpdateLead,
  useTouches,
  useAddTouch,
  useProfile,
  useStageHistory,
  useRecomputeSignalScore,
  useSaveDraft,
  useDrafts,
  STAGES,
} from "@/lib/leads-api";
import { NeuButton, NeuInput, NeuTextarea, NeuSelect, NeuBadge } from "@/components/ui/neu";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { scoreColor } from "@/lib/signal-score";
import { captureError } from "@/lib/error-service";

export function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { user } = useAuth();
  const update = useUpdateLead();
  const { data: touches = [], isLoading: touchesLoading } = useTouches(lead.id);
  const { data: profile } = useProfile(user?.id);
  const addTouch = useAddTouch();
  const recomputeScore = useRecomputeSignalScore();
  const saveDraft = useSaveDraft(user?.id ?? "");
  const { data: savedDrafts = [], isLoading: draftsLoading } = useDrafts(lead.id);
  const { data: stageHistory = [], isLoading: historyLoading } = useStageHistory(lead.id);
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
      const res = await supabase.functions.invoke("ai-task", {
        body: {
          task: "email_draft",
          payload: {
            name: lead.name,
            company: lead.company,
            niche: lead.niche,
            stage: lead.stage,
            last_note: lastNote,
            user_icp: profile?.icp_text ?? "",
          },
        },
      });
      if (res.error) throw res.error;
      const output = res.data?.output ?? "";
      setDraft(output);
      if (user) {
        await supabase
          .from("ai_logs")
          .insert({
            user_id: user.id,
            lead_id: lead.id,
            type: "email_draft",
            input: `name:${lead.name} stage:${lead.stage}`,
            output: output.slice(0, 5000),
          })
          .maybeSingle();
      }
    } catch (e) {
      captureError(e, "lead-email-draft", { leadId: lead.id });
      toast.error("Couldn't generate draft");
    } finally {
      setDraftBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md bg-background h-full overflow-y-auto p-4 sm:p-6 neu-raised-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0">
            <input
              defaultValue={lead.name}
              onBlur={(e) =>
                e.target.value !== lead.name &&
                update.mutate({ id: lead.id, patch: { name: e.target.value }, userId: user!.id })
              }
              className="text-xl font-bold text-foreground bg-transparent w-full outline-none"
            />
            <input
              defaultValue={lead.company ?? ""}
              onBlur={(e) =>
                update.mutate({ id: lead.id, patch: { company: e.target.value }, userId: user!.id })
              }
              placeholder="Company"
              className="text-sm text-muted-foreground bg-transparent w-full outline-none mt-0.5"
            />
          </div>
          <button
            onClick={onClose}
            className="neu-pressable rounded-xl p-2 ml-2"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <div className="relative">
            <NeuBadge color={sc === "red" ? "red" : sc === "amber" ? "amber" : "green"}>
              Signal {lead.signal_score}
            </NeuBadge>
            <button
              onClick={() => recomputeScore.mutate(lead.id)}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-foreground/10 text-[9px] font-bold flex items-center justify-center hover:bg-foreground/20"
              title="Recompute signal score"
              aria-label="Recompute signal score"
            >
              ↻
            </button>
          </div>
          <NeuSelect
            value={lead.stage}
            onChange={(e) =>
              update.mutate({
                id: lead.id,
                patch: { stage: e.target.value, stage_changed_at: new Date().toISOString() },
                userId: user!.id,
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
                update.mutate({
                  id: lead.id,
                  patch: { deal_value: Number(e.target.value) },
                  userId: user!.id,
                })
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
              onBlur={(e) =>
                update.mutate({ id: lead.id, patch: { niche: e.target.value }, userId: user!.id })
              }
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Source
            </label>
            <NeuSelect
              defaultValue={lead.source ?? ""}
              onChange={(e) =>
                update.mutate({
                  id: lead.id,
                  patch: { source: e.target.value || null },
                  userId: user!.id,
                })
              }
              className="mt-1.5"
            >
              <option value="">None</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Referral">Referral</option>
              <option value="Cold Email">Cold Email</option>
              <option value="Website">Website</option>
              <option value="Event">Event</option>
              <option value="Other">Other</option>
            </NeuSelect>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {["Hot", "Warm", "Cold", "VIP", "Partner", "Trial"].map((tag) => {
                const active = (lead.tags ?? []).includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      const current = lead.tags ?? [];
                      const next = active
                        ? current.filter((t: string) => t !== tag)
                        : [...current, tag];
                      update.mutate({ id: lead.id, patch: { tags: next }, userId: user!.id });
                    }}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border-2 border-black transition-all ${
                      active
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Notes
            </label>
            <NeuTextarea
              rows={4}
              defaultValue={lead.notes ?? ""}
              onBlur={(e) =>
                update.mutate({ id: lead.id, patch: { notes: e.target.value }, userId: user!.id })
              }
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
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => {
                      saveDraft.mutate({ lead_id: lead.id, body: draft });
                      toast.success("Draft saved");
                    }}
                    className="neu-pressable rounded-lg p-2"
                    title="Save draft"
                    aria-label="Save draft"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(draft);
                      toast.success("Copied");
                    }}
                    className="neu-pressable rounded-lg p-2"
                    aria-label="Copy draft to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
            {savedDrafts.length > 0 && (
              <div className="mt-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Saved drafts ({savedDrafts.length})
                </label>
                <div className="mt-1 space-y-1">
                  {savedDrafts.slice(0, 3).map((d: { id: string; body: string }) => (
                    <div
                      key={d.id}
                      className="neu-inset-sm rounded-lg p-2 text-xs text-foreground whitespace-pre-wrap truncate"
                    >
                      {d.body.slice(0, 100)}...
                    </div>
                  ))}
                </div>
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
              Stage History
            </label>
            <div className="space-y-1 mt-2">
              {historyLoading ? (
                <p className="text-xs text-muted-foreground animate-pulse">
                  Loading stage history…
                </p>
              ) : stageHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">No stage changes recorded.</p>
              ) : (
                stageHistory.slice(0, 10).map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold">{s.from_stage ?? "—"}</span>
                    <span className="text-[10px]">→</span>
                    <span className="font-semibold text-foreground">{s.to_stage}</span>
                    <span className="ml-auto text-[10px]">
                      {new Date(s.changed_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Timeline
            </label>
            <div className="space-y-2 mt-2">
              {touchesLoading ? (
                <p className="text-xs text-muted-foreground animate-pulse">Loading timeline…</p>
              ) : touches.length === 0 ? (
                <p className="text-xs text-muted-foreground">No touches logged yet.</p>
              ) : (
                touches.map((t) => (
                  <div key={t.id} className="neu-raised-sm rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider">
                        {t.type.replace("_", " ")}
                      </span>
                      <span>{new Date(t.touched_at).toLocaleDateString()}</span>
                    </div>
                    {t.note && <p className="text-sm text-foreground mt-1">{t.note}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
