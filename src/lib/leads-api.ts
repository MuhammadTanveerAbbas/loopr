import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Draft, AuditLog } from "@/integrations/supabase/supplemental-types";
import { updateLeadSchema, createTouchSchema, sanitizeString } from "./schemas";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type Lead = LeadRow;
export type Touch = Database["public"]["Tables"]["lead_touches"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type { Draft, AuditLog } from "@/integrations/supabase/supplemental-types";

export const STAGES = [
  "Contacted",
  "Replied",
  "Call Booked",
  "Proposal Sent",
  "Negotiating",
  "Won",
  "Lost",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_COLOR: Record<string, "blue" | "amber" | "green" | "purple" | "red" | "muted"> =
  {
    Contacted: "muted",
    Replied: "blue",
    "Call Booked": "amber",
    "Proposal Sent": "purple",
    Negotiating: "amber",
    Won: "green",
    Lost: "red",
  };

export interface LeadFilters {
  stage?: string;
  minScore?: number;
  search?: string;
}

export interface PaginatedLeads {
  leads: Lead[];
  total: number;
  hasMore: boolean;
}

const DEFAULT_PAGE_SIZE = 50;

export function useLeads(options?: { pageSize?: number; includeDeleted?: boolean }) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const includeDeleted = options?.includeDeleted ?? false;

  return useQuery({
    queryKey: ["leads", pageSize, includeDeleted],
    queryFn: async () => {
      let query = supabase.from("leads").select("*", { count: "exact" });
      if (!includeDeleted) {
        query = query.is("deleted_at", null);
      }
      const { data, error, count } = await query
        .order("updated_at", { ascending: false })
        .limit(pageSize);
      if (error) throw error;
      return {
        leads: (data ?? []) as Lead[],
        total: count ?? 0,
        hasMore: (data?.length ?? 0) >= pageSize,
      } as PaginatedLeads;
    },
  });
}

export function useTouches(leadId: string | null) {
  return useQuery({
    queryKey: ["touches", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_touches")
        .select("*")
        .eq("lead_id", leadId!)
        .order("touched_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Touch[];
    },
  });
}

export function useStageHistory(leadId: string | null) {
  return useQuery({
    queryKey: ["stage_history", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_history")
        .select("*")
        .eq("lead_id", leadId!)
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Lead> }) => {
      const sanitized: Record<string, unknown> = { ...patch };
      for (const key of Object.keys(sanitized)) {
        const val = sanitized[key];
        if (typeof val === "string") {
          sanitized[key] = sanitizeString(val);
        }
      }
      const parsed = updateLeadSchema.parse(sanitized);
      const { data, error } = await supabase
        .from("leads")
        .update(parsed)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
    onError: (err) => {
      if (err instanceof Error) {
        console.error("Failed to update lead:", err.message);
      }
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Database["public"]["Tables"]["leads"]["Insert"]) => {
      const validated = {
        ...lead,
        name: lead.name ? sanitizeString(lead.name) : lead.name,
        company: lead.company ? sanitizeString(lead.company) : lead.company,
        niche: lead.niche ? sanitizeString(lead.niche) : lead.niche,
        notes: lead.notes ? sanitizeString(lead.notes) : lead.notes,
        next_action: lead.next_action ? sanitizeString(lead.next_action) : lead.next_action,
      };
      if (validated.email) {
        const { data: existing } = await supabase
          .from("leads")
          .select("id")
          .eq("email", validated.email)
          .maybeSingle();
        if (existing) throw new Error("A lead with this email already exists.");
      }
      const { data, error } = await supabase.from("leads").insert(validated).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
    onError: (err) => {
      if (err instanceof Error) {
        console.error("Failed to create lead:", err.message);
      }
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
    onError: (err) => {
      if (err instanceof Error) {
        console.error("Failed to delete lead:", err.message);
      }
    },
  });
}

export function useRecomputeSignalScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.rpc("recompute_signal_score", { lead_id: leadId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useAddTouch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Database["public"]["Tables"]["lead_touches"]["Insert"]) => {
      const parsed = createTouchSchema.parse({
        lead_id: t.lead_id,
        type: t.type,
        note: t.note ? sanitizeString(t.note) : t.note,
        sentiment: t.sentiment,
      });
      const { data, error } = await supabase
        .from("lead_touches")
        .insert({ ...parsed, user_id: t.user_id })
        .select()
        .single();
      if (error) throw error;
      const patch: Partial<Lead> = { last_contact: new Date().toISOString() };
      if (t.type === "reply_received") patch.has_reply = true;
      if (t.sentiment) patch.last_sentiment = t.sentiment;
      const { error: updateError } = await supabase
        .from("leads")
        .update(patch)
        .eq("id", t.lead_id!);
      if (updateError) throw updateError;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["touches", vars.lead_id] });
    },
    onError: (err) => {
      if (err instanceof Error) {
        console.error("Failed to log touch:", err.message);
      }
    },
  });
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("icp_text")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useDrafts(leadId?: string) {
  return useQuery({
    queryKey: ["drafts", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      let q = supabase.from("drafts").select("*").order("created_at", { ascending: false });
      if (leadId) q = q.eq("lead_id", leadId);
      const { data, error } = await q.limit(20);
      if (error) throw error;
      return (data ?? []) as Draft[];
    },
  });
}

export function useSaveDraft(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: { lead_id: string; subject?: string; body: string }) => {
      const { error } = await supabase.from("drafts").insert({
        ...draft,
        user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}
