// =============================================================================
// ai-task edge function — self-contained (ai-client merged in)
// Handles all AI tasks: briefing, email_draft, reply_analysis, icp_score,
// recap, reengage, autopsy.
// Self-healing: model discovery + fallback + bounded retry with backoff.
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ---------------------------------------------------------------------------
// AI Client (inlined from ai-client.ts)
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const MODEL_CACHE_TTL_MS = 15 * 60 * 1000;
const MODEL_FETCH_TIMEOUT_MS = 10_000;
const CHAT_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;
const MAX_BACKOFF_MS = 10_000;
const RETRY_AFTER_CAP_MS = 60_000;
const BASE_DELAY_MS = 1_000;

const MODEL_PREFERENCE: string[] = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

let modelCache: { ids: string[]; fetchedAt: number } | null = null;
let inflightFetch: Promise<string[]> | null = null;

type ChatErrorCode = "rate_limit" | "timeout" | "transient" | "model_invalid" | "auth" | "fatal" | "no_model";

class ChatError extends Error {
  code: ChatErrorCode;
  status?: number;
  constructor(message: string, code: ChatErrorCode, status?: number) {
    super(message);
    this.name = "ChatError";
    this.code = code;
    this.status = status;
  }
}

interface ChatMessage { role: "system" | "user" | "assistant"; content: string; }

interface CompletionOptions {
  apiKey: string; endpoint?: string; model: string; messages: ChatMessage[];
  maxTokens?: number; temperature?: number; timeoutMs?: number; maxRetries?: number;
}

interface GenerateOptions {
  apiKey: string; endpoint?: string; preferredModel?: string; messages: ChatMessage[];
  maxTokens?: number; temperature?: number;
}

function modelsEndpoint(endpoint: string): string {
  return endpoint.replace(/\/chat\/completions\/?$/, "/models");
}

function parseModelIds(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  const ids: string[] = [];
  for (const item of data) {
    if (item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string") {
      ids.push((item as { id: string }).id);
    }
  }
  return [...new Set(ids)];
}

async function getAvailableModels(apiKey: string, endpoint: string, forceRefresh = false): Promise<string[]> {
  const now = Date.now();
  if (!forceRefresh && modelCache && now - modelCache.fetchedAt < MODEL_CACHE_TTL_MS) return modelCache.ids;
  if (inflightFetch) return inflightFetch;

  inflightFetch = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), MODEL_FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(modelsEndpoint(endpoint), {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: controller.signal,
        });
        if (!res.ok) return modelCache?.ids ?? [];
        const ids = parseModelIds(await res.json().catch(() => null));
        if (ids.length > 0) modelCache = { ids, fetchedAt: now };
        return modelCache?.ids ?? [];
      } finally { clearTimeout(timer); }
    } catch {
      return modelCache?.ids ?? [];
    } finally { inflightFetch = null; }
  })();

  return inflightFetch;
}

function selectModel(available: string[], preferred?: string): string | null {
  if (preferred && available.includes(preferred)) return preferred;
  for (const c of MODEL_PREFERENCE) { if (available.includes(c)) return c; }
  return available.find((id) => /^(llama|gemma|mixtral|mistral|qwen)/i.test(id)) ?? available[0] ?? null;
}

function computeRetryDelayMs(attempt: number, retryAfterSeconds?: number | null): number {
  if (typeof retryAfterSeconds === "number" && retryAfterSeconds >= 0) {
    return Math.min(retryAfterSeconds * 1000, RETRY_AFTER_CAP_MS);
  }
  const exp = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_BACKOFF_MS);
  return exp + Math.round(exp * 0.25 * Math.random());
}

function isModelError(status: number, body: string): boolean {
  if (status !== 400 && status !== 404) return false;
  const l = body.toLowerCase();
  return l.includes("model") && (l.includes("not exist") || l.includes("not found") || l.includes("unsupported") || l.includes("unknown") || l.includes("invalid"));
}

function classifyResponse(status: number, body: string): "ok" | "rate_limit" | "auth" | "model_invalid" | "transient" | "fatal" {
  if (status === 429) return "rate_limit";
  if (status === 401 || status === 403) return "auth";
  if (isModelError(status, body)) return "model_invalid";
  if (status === 408 || status === 425 || status >= 500) return "transient";
  if (status >= 400) return "fatal";
  if (status === 200) return "ok";
  return "transient";
}

function extractOutput(bodyText: string): string {
  try {
    const data = JSON.parse(bodyText) as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = data.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : "";
  } catch { return ""; }
}

async function chatCompletion(opts: CompletionOptions): Promise<string> {
  const { apiKey, endpoint = DEFAULT_ENDPOINT, model, messages, maxTokens = 1024, temperature = 0.7, timeoutMs = CHAT_TIMEOUT_MS, maxRetries = MAX_RETRIES } = opts;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response, bodyText = "";
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
        signal: controller.signal,
      });
      bodyText = await res.text();
    } catch (e) {
      const timedOut = e instanceof Error && e.name === "AbortError";
      if (attempt < maxRetries) { await new Promise((r) => setTimeout(r, computeRetryDelayMs(attempt))); continue; }
      throw new ChatError(timedOut ? "AI request timed out" : "AI request failed", timedOut ? "timeout" : "transient");
    } finally { clearTimeout(timer); }

    const kind = classifyResponse(res.status, bodyText);
    if (kind === "ok") {
      const out = extractOutput(bodyText);
      if (out) return out;
      if (attempt < maxRetries) { await new Promise((r) => setTimeout(r, computeRetryDelayMs(attempt))); continue; }
      throw new ChatError("AI returned empty response", "transient", res.status);
    }
    if (kind === "rate_limit") {
      const ra = res.headers.get("retry-after");
      const sec = ra ? Number(ra) : undefined;
      if (attempt < maxRetries) { await new Promise((r) => setTimeout(r, computeRetryDelayMs(attempt, Number.isFinite(sec) ? sec : null))); continue; }
      throw new ChatError("AI rate limit reached", "rate_limit", res.status);
    }
    if (kind === "transient") {
      if (attempt < maxRetries) { await new Promise((r) => setTimeout(r, computeRetryDelayMs(attempt))); continue; }
      throw new ChatError("AI provider error", "transient", res.status);
    }
    if (kind === "auth") throw new ChatError("AI credentials invalid", "auth", res.status);
    if (kind === "model_invalid") throw new ChatError("AI model unavailable", "model_invalid", res.status);
    throw new ChatError("AI request failed", "fatal", res.status);
  }
  throw new ChatError("AI request failed", "fatal");
}

async function generateText(opts: GenerateOptions): Promise<string> {
  const { apiKey, preferredModel = DEFAULT_MODEL, endpoint = DEFAULT_ENDPOINT, ...rest } = opts;
  const available = await getAvailableModels(apiKey, endpoint);
  let model = selectModel(available, preferredModel);

  for (let attempt = 0; attempt <= 1; attempt++) {
    if (!model) model = preferredModel;
    if (!model) throw new ChatError("No AI model available", "no_model");
    try {
      return await chatCompletion({ ...rest, apiKey, endpoint, model });
    } catch (e) {
      if (e instanceof ChatError && e.code === "model_invalid" && attempt === 0) {
        const fresh = await getAvailableModels(apiKey, endpoint, true);
        model = selectModel(fresh.filter((id) => id !== model), preferredModel);
        continue;
      }
      throw e;
    }
  }
  throw new ChatError("AI request failed", "fatal");
}

// ---------------------------------------------------------------------------
// Task router
// ---------------------------------------------------------------------------

const CORS_ORIGIN = Deno.env.get("CORS_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": CORS_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

function sanitize(input: string, max = 2000): string {
  // deno-lint-ignore no-control-regex
  return input.slice(0, max).replace(/[\x00-\x1F\x7F]/g, "");
}

interface TaskPayload {
  leads_summary?: string; name?: string; company?: string; niche?: string;
  stage?: string; last_note?: string; user_icp?: string; text?: string;
  lead_text?: string; notes?: string; last_sentiment?: string;
}

const PROMPTS: Record<string, (p: TaskPayload) => { system: string; user: string }> = {
  briefing: (p) => ({
    system: "You are a sharp sales assistant for a solo founder. Be direct, concise, no fluff.",
    user: `Here is the founder's pipeline:\n\n${p.leads_summary}\n\nWrite a concise briefing (3–5 sentences) about who needs follow-up, who is at risk, and what to prioritize today.`,
  }),
  email_draft: (p) => ({
    system: "You write short personalized outreach emails. Sound like a real founder, not a marketer.",
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

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const jwtClaims = req.headers.get("x-jwt-claims");
    if (!jwtClaims) return jsonResp({ error: "Unauthorized" }, 401);

    let claims: { sub?: string };
    try { claims = JSON.parse(jwtClaims); } catch { return jsonResp({ error: "Unauthorized" }, 401); }

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
    try { body = await req.json(); } catch { return jsonResp({ error: "Invalid JSON" }, 400); }

    const task = typeof body.task === "string" ? body.task : "";
    const rawPayload = body.payload && typeof body.payload === "object" ? (body.payload as Record<string, unknown>) : {};

    if (!PROMPTS[task]) return jsonResp({ error: "Unknown task" }, 400);

    const payload: TaskPayload = {};
    for (const [k, v] of Object.entries(rawPayload)) {
      if (typeof v === "string") payload[k as keyof TaskPayload] = sanitize(v);
    }
    if (JSON.stringify(payload).length > 20_000) return jsonResp({ error: "Payload too large" }, 413);

    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    const AI_ENDPOINT = Deno.env.get("AI_ENDPOINT") || DEFAULT_ENDPOINT;
    const AI_MODEL = Deno.env.get("AI_MODEL") || DEFAULT_MODEL;
    if (!AI_API_KEY) return jsonResp({ error: "AI not configured" }, 500);

    const { system, user } = PROMPTS[task](payload);

    let output = "";
    try {
      output = await generateText({
        apiKey: AI_API_KEY,
        endpoint: AI_ENDPOINT,
        preferredModel: AI_MODEL,
        messages: [
          { role: "system", content: sanitize(system, 4000) },
          { role: "user", content: sanitize(user, 4000) },
        ],
        maxTokens: 1024,
        temperature: 0.7,
      });
    } catch (e) {
      if (e instanceof ChatError) {
        console.error(`ai-task: completion failed (${e.code})`, e.status ?? "", e.message);
        switch (e.code) {
          case "rate_limit": return jsonResp({ error: "Rate limit. Try again in a moment." }, 429);
          case "timeout": return jsonResp({ error: "AI request timed out. Try again." }, 504);
          case "auth": return jsonResp({ error: "AI credentials invalid. Check API key." }, 401);
          case "model_invalid":
          case "no_model": return jsonResp({ error: "AI model unavailable. Try again later." }, 500);
          default: return jsonResp({ error: "AI request failed. Try again." }, 500);
        }
      }
      console.error("ai-task: unexpected error", e);
      return jsonResp({ error: "Internal server error" }, 500);
    }

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from("ai_logs").insert({
          user_id: userId,
          type: task,
          input: JSON.stringify(payload).slice(0, 2000),
          output: output.slice(0, 5000),
        }).maybeSingle();
      } catch { /* non-fatal */ }
    }

    return jsonResp({ output });
  } catch (e) {
    console.error("ai-task error", e);
    return jsonResp({ error: "Internal server error" }, 500);
  }
});
