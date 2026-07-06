import { z } from "zod";
import { STAGES } from "@/config/plans";

export { STAGES };
export const stageSchema = z.enum(STAGES);

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  company: z.string().max(200).optional().nullable(),
  niche: z.string().max(200).optional().nullable(),
  stage: stageSchema.default("Contacted"),
  deal_value: z.number().min(0, "Deal value must be non-negative").default(0),
  notes: z.string().max(5000).optional().nullable(),
  next_action: z.string().max(500).optional().nullable(),
  owner: z.string().max(200).optional().nullable(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  company: z.string().max(200).optional().nullable(),
  niche: z.string().max(200).optional().nullable(),
  stage: stageSchema.optional(),
  deal_value: z.number().min(0).optional(),
  signal_score: z.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional().nullable(),
  next_action: z.string().max(500).optional().nullable(),
  last_contact: z.string().optional().nullable(),
  last_sentiment: z.string().max(50).optional().nullable(),
  has_reply: z.boolean().optional(),
  stage_changed_at: z.string().optional(),
  tags: z.array(z.string().max(50)).optional(),
  source: z.string().max(100).optional().nullable(),
  starred: z.boolean().optional(),
});

export const createTouchSchema = z.object({
  lead_id: z.string().uuid(),
  type: z.enum(["note", "email_sent", "reply_received", "call", "meeting"]),
  note: z.string().max(2000).optional().nullable(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional().nullable(),
});

export const profileSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  icp_text: z.string().max(10000).optional().nullable(),
});

export const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(100).optional(),
});

export function sanitizeString(input: string): string {
  return (
    input
      .replace(/[<>]/g, "")
      .replace(/&(nbsp|amp|lt|gt|quot|#\d+|#x[\da-fA-F]+);?/g, "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F]/g, "")
      .trim()
  );
}
