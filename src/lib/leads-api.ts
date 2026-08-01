import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Draft, AuditLog } from "@/integrations/supabase/supplemental-types";
import { updateLeadSchema, createTouchSchema, sanitizeString } from "./schemas";
import { STAGES, STAGE_COLOR } from "@/config/plans";
import type { Stage } from "@/config/plans";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type Lead = LeadRow;
export type Touch = Database["public"]["Tables"]["lead_touches"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type { Draft, AuditLog } from "@/integrations/supabase/supplemental-types";
export { STAGES, STAGE_COLOR };
export type { Stage };

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

const DEFAULT_PAGE_SIZE = 500;

function invalidateLeadQueries(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["leads"] });
  qc.invalidateQueries({ queryKey: ["leads_trending"] });
  qc.invalidateQueries({ queryKey: ["dashboard_stats"] });
  qc.invalidateQueries({ queryKey: ["touches"] });
  qc.invalidateQueries({ queryKey: ["drafts"] });
  qc.invalidateQueries({ queryKey: ["stage_history"] });
}

async function verifyLeadOwnership(leadId: string, userId: string) {
  const { data, error } = await supabase.from("leads").select("user_id").eq("id", leadId).single();
  if (error || !data || data.user_id !== userId) {
    throw new Error("Unauthorized");
  }
}

async function verifyLeadExists(leadId: string) {
  const { data, error } = await supabase.from("leads").select("id").eq("id", leadId).single();
  if (error || !data) {
    throw new Error("Lead not found");
  }
}

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
    mutationFn: async ({
      id,
      patch,
      userId,
    }: {
      id: string;
      patch: Partial<Lead>;
      userId?: string;
    }) => {
      if (userId) await verifyLeadOwnership(id, userId);
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
    onSuccess: () => invalidateLeadQueries(qc),
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
    onSuccess: () => invalidateLeadQueries(qc),
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
    mutationFn: async ({ id, userId }: { id: string; userId?: string }) => {
      if (userId) await verifyLeadOwnership(id, userId);
      const { error } = await supabase
        .from("leads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateLeadQueries(qc),
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
    onSuccess: () => invalidateLeadQueries(qc),
  });
}

export interface DashboardStats {
  total_leads: number;
  pipeline_value: number;
  reply_rate: number;
  won_count_month: number;
  won_value_month: number;
  stage_counts: Record<string, number>;
  at_risk: Array<{
    id: string;
    name: string;
    company: string | null;
    stage: string;
    deal_value: number;
    days_silent: number;
  }>;
  total_won: number;
  won_count: number;
  pipeline_leads: number;
  trends_prev_total: number;
  trends_prev_won: number;
}

function computeDashboardStats(leads: Lead[]): DashboardStats {
  const active = leads.filter((l) => !["Won", "Lost"].includes(l.stage));
  const replied = leads.filter((l) => l.has_reply);
  const won = leads.filter((l) => l.stage === "Won");
  const now = new Date();
  const wonThisMonth = won.filter((l) => {
    const d = new Date(l.updated_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const stageCounts: Record<string, number> = {};
  for (const l of leads) stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1;

  const atRisk = leads
    .filter((l) => {
      if (["Won", "Lost"].includes(l.stage)) return false;
      const ds = Math.abs(
        Math.round((Date.now() - new Date(l.last_contact || l.created_at).getTime()) / 86400000),
      );
      return ds >= 5;
    })
    .map((l) => ({
      id: l.id,
      name: l.name,
      company: l.company,
      stage: l.stage,
      deal_value: Number(l.deal_value),
      days_silent: Math.abs(
        Math.round((Date.now() - new Date(l.last_contact || l.created_at).getTime()) / 86400000),
      ),
    }))
    .sort((a, b) => b.days_silent - a.days_silent)
    .slice(0, 10);

  const weekAgo = Date.now() - 7 * 86400000;
  const twoWeeksAgo = Date.now() - 14 * 86400000;
  const prevTotal = leads.filter((l) => {
    const d = new Date(l.created_at).getTime();
    return d >= twoWeeksAgo && d < weekAgo;
  }).length;
  const prevWon = leads.filter((l) => {
    if (l.stage !== "Won") return false;
    const d = new Date(l.updated_at).getTime();
    return d >= twoWeeksAgo && d < weekAgo;
  }).length;

  return {
    total_leads: leads.length,
    pipeline_value: active.reduce((s, l) => s + Number(l.deal_value), 0),
    reply_rate: leads.length ? Math.round((replied.length / leads.length) * 100) : 0,
    won_count_month: wonThisMonth.length,
    won_value_month: wonThisMonth.reduce((s, l) => s + Number(l.deal_value), 0),
    stage_counts: stageCounts,
    at_risk: atRisk,
    total_won: won.reduce((s, l) => s + Number(l.deal_value), 0),
    won_count: won.length,
    pipeline_leads: active.length,
    trends_prev_total: prevTotal,
    trends_prev_won: prevWon,
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_dashboard_stats");
      if (!rpcError && rpcData) return rpcData as unknown as DashboardStats;

      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("*", { count: "exact" })
        .is("deleted_at", null)
        .limit(500);
      if (leadsError) throw leadsError;
      return computeDashboardStats(leads ?? []);
    },
    staleTime: 30000,
    retry: 1,
  });
}

export function useHardDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("hard_delete_lead", { lead_id: id });
      if (error) throw error;
    },
    onSuccess: () => invalidateLeadQueries(qc),
    onError: (err) => {
      if (err instanceof Error) {
        console.error("Failed to permanently delete lead:", err.message);
      }
    },
  });
}

export function useTrendingLeads(limit = 5) {
  return useQuery({
    queryKey: ["leads_trending", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, company, stage, deal_value, signal_score, last_contact, updated_at")
        .is("deleted_at", null)
        .not("stage", "in", '("Won","Lost")')
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useAddTouch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Database["public"]["Tables"]["lead_touches"]["Insert"]) => {
      if (t.user_id && t.lead_id) await verifyLeadOwnership(t.lead_id, t.user_id);
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
    onSuccess: () => {
      invalidateLeadQueries(qc);
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
