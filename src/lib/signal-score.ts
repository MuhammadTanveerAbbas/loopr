import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export function computeSignalScore(
  lead: Pick<
    Lead,
    "stage" | "deal_value" | "last_contact" | "stage_changed_at" | "last_sentiment" | "has_reply"
  >,
  lastNoteAt?: string | null,
): number {
  let score = 50;
  const now = Date.now();
  const stage = lead.stage;
  if (["Replied", "Call Booked", "Negotiating"].includes(stage)) score += 15;
  if (Number(lead.deal_value) > 2000) score += 10;

  const daysSilent = lead.last_contact
    ? Math.floor((now - new Date(lead.last_contact).getTime()) / 86400000)
    : 999;
  if (lead.has_reply && daysSilent <= 7) score += 10;
  if (lastNoteAt && (now - new Date(lastNoteAt).getTime()) / 86400000 <= 3) score += 5;

  if (daysSilent >= 15) score -= 30;
  else if (daysSilent >= 8) score -= 20;
  else if (daysSilent >= 5) score -= 10;

  if (lead.last_sentiment === "negative") score -= 15;
  if (lead.last_sentiment === "positive") score += 5;

  if (lead.stage_changed_at) {
    const stageDays = (now - new Date(lead.stage_changed_at).getTime()) / 86400000;
    if (stageDays >= 14) score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}

export function scoreColor(score: number): "red" | "amber" | "green" {
  if (score < 40) return "red";
  if (score <= 70) return "amber";
  return "green";
}

export function daysSilent(lastContact: string | null): number | null {
  if (!lastContact) return null;
  return Math.floor((Date.now() - new Date(lastContact).getTime()) / 86400000);
}
