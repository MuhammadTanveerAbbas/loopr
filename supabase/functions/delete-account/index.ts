// Account deletion edge function. Deletes user data and auth user.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") ?? "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const jwtClaims = req.headers.get("x-jwt-claims");
    if (!jwtClaims) return jsonResp({ error: "Unauthorized" }, 401);

    let claims: { sub?: string };
    try {
      claims = JSON.parse(jwtClaims);
    } catch {
      return jsonResp({ error: "Unauthorized" }, 401);
    }

    const userId = claims.sub;
    if (!userId) return jsonResp({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Delete public schema data (cascades to related tables)
    await supabase.from("leads").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.from("audit_logs").delete().eq("user_id", userId);
    await supabase.from("ai_logs").delete().eq("user_id", userId);
    await supabase.from("drafts").delete().eq("user_id", userId);

    // Delete the auth user last
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return jsonResp({ error: error.message }, 500);

    return jsonResp({ success: true });
  } catch {
    return jsonResp({ error: "Internal server error" }, 500);
  }
});

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
