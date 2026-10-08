// =============================================================================
// Supabase Integration — single unified entry point
//
// Client-side:
//   import { supabase } from "@/integrations/supabase"
//
// Server-side (admin / service-role):
//   import { supabaseAdmin } from "@/integrations/supabase"
//
// Auth middleware (TanStack Start server functions):
//   import { requireSupabaseAuth } from "@/integrations/supabase"
//
// Types:
//   import type { Database, Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase"
// =============================================================================

// ---------------------------------------------------------------------------
// JSON scalar
// ---------------------------------------------------------------------------

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ---------------------------------------------------------------------------
// Database type (generated from schema)
// ---------------------------------------------------------------------------

export type Database = {
  /** @internal Allows createClient to auto-select the right PostgREST version */
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      ai_logs: {
        Row: {
          created_at: string;
          id: string;
          input: string | null;
          lead_id: string | null;
          output: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          input?: string | null;
          lead_id?: string | null;
          output?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          input?: string | null;
          lead_id?: string | null;
          output?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_logs_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          table_name: string;
          record_id: string | null;
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      drafts: {
        Row: {
          id: string;
          lead_id: string | null;
          user_id: string;
          subject: string | null;
          body: string;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          user_id: string;
          subject?: string | null;
          body: string;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          user_id?: string;
          subject?: string | null;
          body?: string;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drafts_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_touches: {
        Row: {
          id: string;
          lead_id: string;
          note: string | null;
          sentiment: string | null;
          touched_at: string;
          type: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          note?: string | null;
          sentiment?: string | null;
          touched_at?: string;
          type: string;
          user_id: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          note?: string | null;
          sentiment?: string | null;
          touched_at?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_touches_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          company: string | null;
          created_at: string;
          deal_value: number;
          deleted_at: string | null;
          email: string | null;
          has_reply: boolean;
          id: string;
          last_contact: string | null;
          last_sentiment: string | null;
          name: string;
          next_action: string | null;
          niche: string | null;
          notes: string | null;
          owner: string | null;
          signal_score: number;
          source: string | null;
          stage: string;
          stage_changed_at: string;
          starred: boolean;
          tags: string[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          company?: string | null;
          created_at?: string;
          deal_value?: number;
          deleted_at?: string | null;
          email?: string | null;
          has_reply?: boolean;
          id?: string;
          last_contact?: string | null;
          last_sentiment?: string | null;
          name: string;
          next_action?: string | null;
          niche?: string | null;
          notes?: string | null;
          owner?: string | null;
          signal_score?: number;
          source?: string | null;
          stage?: string;
          stage_changed_at?: string;
          starred?: boolean;
          tags?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          company?: string | null;
          created_at?: string;
          deal_value?: number;
          deleted_at?: string | null;
          email?: string | null;
          has_reply?: boolean;
          id?: string;
          last_contact?: string | null;
          last_sentiment?: string | null;
          name?: string;
          next_action?: string | null;
          niche?: string | null;
          notes?: string | null;
          owner?: string | null;
          signal_score?: number;
          source?: string | null;
          stage?: string;
          stage_changed_at?: string;
          starred?: boolean;
          tags?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          icp_text: string | null;
          id: string;
          name: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          icp_text?: string | null;
          id: string;
          name?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          icp_text?: string | null;
          id?: string;
          name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      stage_history: {
        Row: {
          changed_at: string;
          from_stage: string | null;
          id: string;
          lead_id: string;
          to_stage: string;
          user_id: string;
        };
        Insert: {
          changed_at?: string;
          from_stage?: string | null;
          id?: string;
          lead_id: string;
          to_stage: string;
          user_id: string;
        };
        Update: {
          changed_at?: string;
          from_stage?: string | null;
          id?: string;
          lead_id?: string;
          to_stage?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stage_history_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      bulk_update_leads_stage: {
        Args: { lead_ids: string[]; new_stage: string; p_user_id: string };
        Returns: void;
      };
      cleanup_old_deleted_leads: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_dashboard_stats: {
        Args: Record<string, never>;
        Returns: Json;
      };
      hard_delete_lead: {
        Args: { lead_id: string };
        Returns: void;
      };
      recompute_all_signal_scores: {
        Args: Record<string, never>;
        Returns: number;
      };
      recompute_signal_score: {
        Args: { lead_id: string };
        Returns: number;
      };
      restore_lead: {
        Args: { lead_id: string };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---------------------------------------------------------------------------
// Supplemental types (not generated — maintained manually)
// ---------------------------------------------------------------------------

export interface Draft {
  id: string;
  lead_id: string | null;
  user_id: string;
  subject: string | null;
  body: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Type helpers (generated)
// ---------------------------------------------------------------------------

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

// ---------------------------------------------------------------------------
// Browser / client-side Supabase client (anon key, RLS-enforced)
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

function createSupabaseClient() {
  const SUPABASE_URL =
    (typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_URL : undefined) ||
    process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    (typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY
      : undefined) || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

/**
 * Browser Supabase client (anon key, RLS-enforced).
 * Import: `import { supabase } from "@/integrations/supabase"`
 */
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});

// ---------------------------------------------------------------------------
// Server-side Supabase client (service role key — bypasses RLS)
// SECURITY: Only use inside server functions / server routes. Never send to browser.
// ---------------------------------------------------------------------------

function createSupabaseAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing server Supabase env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

/**
 * Server-only admin client (service role — bypasses RLS).
 * Import: `import { supabaseAdmin } from "@/integrations/supabase"`
 */
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});

// ---------------------------------------------------------------------------
// Auth middleware for TanStack Start server functions
// ---------------------------------------------------------------------------

import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * TanStack Start middleware that validates the Bearer token and injects
 * { supabase, userId, claims } into server-function context.
 *
 * Usage:
 *   export const myFn = createServerFn()
 *     .middleware([requireSupabaseAuth])
 *     .handler(async ({ context }) => { ... })
 */
export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Response(
        "Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set.",
        { status: 500 },
      );
    }

    const request = getRequest();

    if (!request?.headers) {
      throw new Response("Unauthorized: No request headers available", { status: 401 });
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      throw new Response("Unauthorized: No authorization header provided", { status: 401 });
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new Response("Unauthorized: Only Bearer tokens are supported", { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      throw new Response("Unauthorized: No token provided", { status: 401 });
    }

    const client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) {
      throw new Response("Unauthorized: Invalid token", { status: 401 });
    }

    return next({
      context: {
        supabase: client,
        userId: data.user.id,
        claims: data.user.app_metadata ?? {},
      },
    });
  },
);
