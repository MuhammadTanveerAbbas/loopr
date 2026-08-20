// AI task router. Calls configurable AI Gateway with task-specific prompts.
// AI access is centralized behind ./ai-client.ts, which adds model discovery,
// model fallback, and bounded retries for rate limits and transient failures.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ChatError, generateText } from "./ai-client.ts";

const CORS_ORIGIN = Deno.env.get("CORS_ORIGIN");
if (!CORS_ORIGIN) {
  console.error("CORS_ORIGIN environment variable is required for security");
  Deno.exit(1);
}
const corsHeaders = {
  "Access-Control-Allow-Origin": CORS_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

function sanitizeInput(input: string, maxLength: number = 2000): string {
  // eslint-disable-next-line no-control-regex
  return input.slice(0, maxLength).replace(/[\x00-\x1F\x7F]/g, "");
}

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
  notes?: string;
  last_sentiment?: string;
}

const PROMPTS: Record<string, (p: TaskPayload) => { system: string; user: string }> = {
  briefing: (p) => ({
    system: "You are a sharp sales assistant for a solo founder. Be direct, concise, no fluff.",
    user: `Here is the founder's pipeline:\n\n${p.leads_summary}\n\nWrite a concise briefing (3–5 sentences) about who needs follow-up, who is at risk, and what to prioritize today.`,
  }),
  email_draft: (p) => ({
    system:
      "You write short personalized outreach emails. Sound like a real founder, not a marketer.",
    user: `Write a subject line and email body (under 120 words) for this lead:\nName: ${p.name}\nCompany: ${p.company || ""}\nNiche: ${p.niche || ""}\nStage: ${p.stage}\nLast note: ${p.last_note || ""}\nMy ICP: ${p.user_icp || ""}\n\nFormat as:\nSubject: ...\n\n[body]`,
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
    user: `Lead: ${p.name} at ${p.company || ""}, stage ${p.stage}. Write a brief, casual re-engage message (under 60 words). No "just checking in".`,
  }),
  autopsy: (p) => ({
    system: "You analyze why deals are lost.",
    user: `Lost deal: ${p.name} at ${p.company || ""}.\nNotes: ${p.notes || ""}\nLast sentiment: ${p.last_sentiment || ""}\n\nIn 2-3 sentences: what likely went wrong, when momentum died, what signal was missed.`,
  }),
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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { count, error: rlError } = await supabase
        .from("ai_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString());

      if (!rlError && (count ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
        return jsonResp({ error: "Rate limit exceeded. Try again in a minute." }, 429);
      }
    }

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

    if (!PROMPTS[task]) return jsonResp({ error: "Unknown task" }, 400);

    const sanitizedPayload: TaskPayload = {};
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === "string") {
        sanitizedPayload[key as keyof TaskPayload] = sanitizeInput(value);
      }
    }

    const serialized = JSON.stringify(sanitizedPayload);
    if (serialized.length > 20_000) return jsonResp({ error: "Payload too large" }, 413);

    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    const AI_ENDPOINT =
      Deno.env.get("AI_ENDPOINT") || "https://api.groq.com/openai/v1/chat/completions";
    const AI_MODEL = Deno.env.get("AI_MODEL") || "llama-3.3-70b-versatile";
    if (!AI_API_KEY) return jsonResp({ error: "AI not configured" }, 500);

    const { system, user } = PROMPTS[task](sanitizedPayload);

    let output = "";
    try {
      const result = await generateText({
        apiKey: AI_API_KEY,
        endpoint: AI_ENDPOINT,
        preferredModel: AI_MODEL,
        messages: [
          { role: "system", content: sanitizeInput(system, 4000) },
          { role: "user", content: sanitizeInput(user, 4000) },
        ],
        maxTokens: 1024,
        temperature: 0.7,
      });
      output = result.output;
    } catch (e) {
      if (e instanceof ChatError) {
        console.error(`ai-task: completion failed (${e.code})`, e.status ?? "", e.message);
        switch (e.code) {
          case "rate_limit":
            return jsonResp({ error: "Rate limit. Try again in a moment." }, 429);
          case "timeout":
            return jsonResp({ error: "AI request timed out. Try again." }, 504);
          case "auth":
            return jsonResp({ error: "AI credentials invalid. Check API key." }, 401);
          case "model_invalid":
          case "no_model":
            return jsonResp({ error: "AI model unavailable. Try again later." }, 500);
          case "transient":
          case "fatal":
          default:
            return jsonResp({ error: "AI request failed. Try again." }, 500);
        }
      }
      console.error("ai-task: unexpected completion error", e);
      return jsonResp({ error: "Internal server error" }, 500);
    }

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from("ai_logs")
          .insert({
            user_id: userId,
            type: task,
            input: JSON.stringify(sanitizedPayload).slice(0, 2000),
            output: output.slice(0, 5000),
          })
          .maybeSingle();
      } catch {
        // Logging failure is non-fatal
      }
    }

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
