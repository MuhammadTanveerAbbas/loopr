import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type Touch = Database["public"]["Tables"]["lead_touches"]["Row"];

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

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
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
      // bump lead last_contact + has_reply if reply
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
