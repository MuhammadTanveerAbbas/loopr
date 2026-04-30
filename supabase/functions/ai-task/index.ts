// AI task router. Calls configurable AI Gateway with task-specific prompts.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskPayload {
  leads_summary?: string;
  name?: string;
  company?: string;
  niche?: string;
  stage?: string;
  last_note?: string;
  user_icp?: string;
  text?: string;
  lead_text?: string;
}

const PROMPTS: Record<string, (p: TaskPayload) => { system: string; user: string }> = {
  briefing: (p) => ({
    system: "You are a sharp sales assistant for a solo founder. Be direct, concise, no fluff.",
    user: `Here is the founder's pipeline:\n\n${p.leads_summary}\n\nWrite a concise briefing (3–5 sentences) about who needs follow-up, who is at risk, and what to prioritize today.`,
  }),
  email_draft: (p) => ({
    system:
      "You write short personalized outreach emails. Sound like a real founder, not a marketer.",
    user: `Write a subject line and email body (under 120 words) for this lead:\nName: ${p.name}\nCompany: ${p.company || "—"}\nNiche: ${p.niche || "—"}\nStage: ${p.stage}\nLast note: ${p.last_note || "—"}\nMy ICP: ${p.user_icp || "—"}\n\nFormat as:\nSubject: ...\n\n[body]`,
  }),
  reply_analysis: (p) => ({
    system: "You analyze sales reply sentiment. Be terse.",
    user: `Reply:\n${p.text}\n\nClassify as Positive / Neutral / Negative and recommend the next step in ONE sentence. Format:\nSentiment: <X>\nNext: <one sentence>`,
  }),
  icp_score: (p) => ({
    system: "You score sales leads against the user's ICP. Be direct.",
    user: `My ICP: ${p.user_icp || "(none defined)"}\n\nLead description:\n${p.lead_text}\n\nGive an ICP match score (0–10), a short explanation (1–2 sentences), and a 60-word first outreach email. Format:\nScore: X/10\nWhy: ...\nEmail: ...`,
  }),
  recap: (p) => ({
    system: "You write weekly sales recaps for solo founders.",
    user: `Activity from the past 7 days:\n${p.leads_summary}\n\nIn ONE paragraph: what moved, what stalled, what to cut.`,
  }),
  reengage: (p) => ({
    system: "You write short, warm re-engagement messages. Under 60 words.",
    user: `Lead: ${p.name} at ${p.company || "—"}, stage ${p.stage}. Write a brief, casual re-engage message (under 60 words). No "just checking in".`,
  }),
  autopsy: (p) => ({
    system: "You analyze why deals are lost.",
    user: `Lost deal: ${p.name} at ${p.company || "—"}.\nNotes: ${p.notes || "—"}\nLast sentiment: ${p.last_sentiment || "—"}\n\nIn 2-3 sentences: what likely went wrong, when momentum died, what signal was missed.`,
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth check: require a valid Supabase session ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return jsonResp({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY)
      return jsonResp({ error: "Server not configured" }, 500);

    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userData.user) return jsonResp({ error: "Unauthorized" }, 401);

    let body: { task?: unknown; payload?: unknown };
    try {
      body = await req.json();
    } catch {
      return jsonResp({ error: "Invalid JSON" }, 400);
    }
    const task = typeof body.task === "string" ? body.task : "";
    const payload =
      body.payload && typeof body.payload === "object"
        ? (body.payload as Record<string, unknown>)
        : {};
    const builder = PROMPTS[task];
    if (!builder) return jsonResp({ error: "Unknown task" }, 400);

    // Cap payload size to mitigate abusive prompts
    const serialized = JSON.stringify(payload);
    if (serialized.length > 20_000) return jsonResp({ error: "Payload too large" }, 413);

    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    const AI_ENDPOINT = Deno.env.get("AI_ENDPOINT") || "https://api.groq.com/openai/v1/chat/completions";
    if (!AI_API_KEY) return jsonResp({ error: "AI not configured" }, 500);

    const { system, user } = builder(payload);

    const r = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (r.status === 429) return jsonResp({ error: "Rate limit. Try again in a moment." }, 429);
    if (r.status === 401) return jsonResp({ error: "AI credentials invalid. Check API key." }, 401);
    if (!r.ok) {
      console.error("AI gateway error", r.status, await r.text());
      return jsonResp({ error: "AI request failed" }, 500);
    }

    const data = await r.json();
    const output: string = data.choices?.[0]?.message?.content ?? "";
    return jsonResp({ output });
  } catch (e) {
    console.error("ai-task error", e);
    return jsonResp({ error: "Internal server error" }, 500);
  }
});

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
