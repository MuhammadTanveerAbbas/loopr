import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type Touch = Database["public"]["Tables"]["lead_touches"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

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

export function useLeads(options?: { pageSize?: number }) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;

  return useQuery({
    queryKey: ["leads", pageSize],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("leads")
        .select("*", { count: "exact" })
        .order("updated_at", { ascending: false })
        .limit(pageSize);
      if (error) throw error;
      return {
        leads: data as Lead[],
        total: count ?? 0,
        hasMore: (data?.length ?? 0) >= pageSize,
      } as PaginatedLeads;
    },
  });
}

export function useLeadsInfinite() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const pageSize = DEFAULT_PAGE_SIZE;

  return useQuery({
    queryKey: ["leads", "infinite", page],
    queryFn: async () => {
      const from = page * pageSize;
      const { data, error, count } = await supabase
        .from("leads")
        .select("*", { count: "exact" })
        .order("updated_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      return {
        leads: data as Lead[],
        total: count ?? 0,
        hasMore: from + pageSize < (count ?? 0),
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
        .order("touched_at", { ascending: false });
      if (error) throw error;
      return data as Touch[];
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Lead> }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Database["public"]["Tables"]["leads"]["Insert"]) => {
      const { data, error } = await supabase.from("leads").insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useAddTouch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Database["public"]["Tables"]["lead_touches"]["Insert"]) => {
      const { data, error } = await supabase.from("lead_touches").insert(t).select().single();
      if (error) throw error;
      const patch: Partial<Lead> = { last_contact: new Date().toISOString() };
      if (t.type === "reply_received") patch.has_reply = true;
      if (t.sentiment) patch.last_sentiment = t.sentiment;
      await supabase.from("leads").update(patch).eq("id", t.lead_id!);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["touches", vars.lead_id] });
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
