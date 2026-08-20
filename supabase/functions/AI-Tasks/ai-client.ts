// Self-healing Groq client used by the ai-task edge function.
// Dependency-free, Deno-compatible TypeScript. No secrets are ever logged.
//
// Responsibilities:
// - discover available models through the provider's /models endpoint
// - cache the model list server-side with a TTL
// - select a compatible model deterministically (preferred first, then a
//   preference list, then any reasonable chat model)
// - retry rate limits (respecting Retry-After) and transient failures with
//   bounded exponential backoff + jitter
// - fall back to a fresh model automatically when the selected one is rejected

export const DEFAULT_MODEL = "llama-3.3-70b-versatile";
export const DEFAULT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export const MODEL_CACHE_TTL_MS = 15 * 60 * 1000;
export const MODEL_FETCH_TIMEOUT_MS = 10_000;
export const CHAT_TIMEOUT_MS = 20_000;
export const MAX_RETRIES = 2;
export const MAX_BACKOFF_MS = 10_000;
const RETRY_AFTER_CAP_MS = 60_000;
const BASE_DELAY_MS = 1_000;

// Deterministic fallback preference list, ordered by general text-generation
// suitability for the tasks this app performs. The operator-configured model
// is always tried first.
export const MODEL_PREFERENCE: string[] = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

let modelCache: { ids: string[]; fetchedAt: number } | null = null;
let inflightFetch: Promise<string[]> | null = null;

export function resetModelCache(): void {
  modelCache = null;
  inflightFetch = null;
}

export type ChatErrorCode =
  | "rate_limit"
  | "timeout"
  | "transient"
  | "model_invalid"
  | "auth"
  | "fatal"
  | "no_model";

export class ChatError extends Error {
  code: ChatErrorCode;
  status?: number;

  constructor(message: string, code: ChatErrorCode, status?: number) {
    super(message);
    this.name = "ChatError";
    this.code = code;
    this.status = status;
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ModelOptions {
  apiKey: string;
  endpoint?: string;
  forceRefresh?: boolean;
  now?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface CompletionOptions {
  apiKey: string;
  endpoint?: string;
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
  random?: () => number;
  sleepImpl?: (ms: number) => Promise<void>;
}

export interface CompletionResult {
  output: string;
  model: string;
  attempts: number;
  retried: boolean;
}

export interface GenerateOptions {
  apiKey: string;
  endpoint?: string;
  preferredModel?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
  random?: () => number;
  sleepImpl?: (ms: number) => Promise<void>;
  now?: number;
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

// Fetch the currently available model list. Results are cached server-side with
// a TTL so the list is not fetched on every request. Never throws: discovery
// failures fall back to the previous cache or an empty list so the main flow
// can still attempt the operator-configured model.
export async function getAvailableModels(options: ModelOptions): Promise<string[]> {
  const {
    apiKey,
    endpoint = DEFAULT_ENDPOINT,
    forceRefresh = false,
    now = Date.now(),
    timeoutMs = MODEL_FETCH_TIMEOUT_MS,
    fetchImpl = fetch,
  } = options;

  if (!forceRefresh && modelCache && now - modelCache.fetchedAt < MODEL_CACHE_TTL_MS) {
    return modelCache.ids;
  }
  if (inflightFetch) return inflightFetch;

  inflightFetch = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(modelsEndpoint(endpoint), {
          method: "GET",
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: controller.signal,
        });
        if (!res.ok) {
          console.error(`ai-client: model list request failed (${res.status})`);
          return modelCache?.ids ?? [];
        }
        const ids = parseModelIds(await res.json().catch(() => null));
        if (ids.length > 0) modelCache = { ids, fetchedAt: now };
        return modelCache?.ids ?? [];
      } finally {
        clearTimeout(timer);
      }
    } catch {
      console.error("ai-client: model list request failed");
      return modelCache?.ids ?? [];
    } finally {
      inflightFetch = null;
    }
  })();

  return inflightFetch;
}

// Deterministic model selection: preferred model first, then the preference
// list, then any reasonable chat model, then the first available entry.
export function selectModel(available: string[], preferred?: string): string | null {
  if (preferred && available.includes(preferred)) return preferred;
  for (const candidate of MODEL_PREFERENCE) {
    if (available.includes(candidate)) return candidate;
  }
  const fallback = available.find((id) => /^(llama|gemma|mixtral|mistral|qwen)/i.test(id));
  return fallback ?? available[0] ?? null;
}

// Bounded exponential backoff with jitter. When the provider supplies
// Retry-After, that value wins (capped so we never sleep indefinitely).
export function computeRetryDelayMs(
  attempt: number,
  retryAfterSeconds?: number | null,
  random: () => number = Math.random,
): number {
  if (typeof retryAfterSeconds === "number" && retryAfterSeconds >= 0) {
    return Math.min(retryAfterSeconds * 1000, RETRY_AFTER_CAP_MS);
  }
  const exponential = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_BACKOFF_MS);
  const jitter = Math.round(exponential * 0.25 * random());
  return exponential + jitter;
}

type ResponseKind = "ok" | "rate_limit" | "auth" | "model_invalid" | "transient" | "fatal";

function isModelError(status: number, bodyText: string): boolean {
  if (status !== 400 && status !== 404) return false;
  const lower = bodyText.toLowerCase();
  if (!lower.includes("model")) return false;
  return (
    lower.includes("not exist") ||
    lower.includes("does not exist") ||
    lower.includes("not found") ||
    lower.includes("unsupported") ||
    lower.includes("unknown") ||
    lower.includes("invalid")
  );
}

function classifyResponse(status: number, bodyText: string): ResponseKind {
  if (status === 429) return "rate_limit";
  if (status === 401 || status === 403) return "auth";
  if (isModelError(status, bodyText)) return "model_invalid";
  if (status === 408 || status === 425 || status >= 500) return "transient";
  if (status >= 400) return "fatal";
  if (status === 200) return "ok";
  return "transient";
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  return undefined;
}

function extractOutput(bodyText: string): string {
  try {
    const data = JSON.parse(bodyText) as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = data.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : "";
  } catch {
    return "";
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Perform a chat completion with bounded retries for rate limits and transient
// failures. Never retries auth errors, model-invalid errors, or other
// deterministic client errors.
export async function chatCompletion(options: CompletionOptions): Promise<CompletionResult> {
  const {
    apiKey,
    endpoint = DEFAULT_ENDPOINT,
    model,
    messages,
    maxTokens = 1024,
    temperature = 0.7,
    timeoutMs = CHAT_TIMEOUT_MS,
    maxRetries = MAX_RETRIES,
    fetchImpl = fetch,
    random = Math.random,
    sleepImpl = defaultSleep,
  } = options;

  let attempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    let bodyText = "";
    try {
      res = await fetchImpl(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });
      bodyText = await res.text();
    } catch (e) {
      const timedOut = e instanceof Error && e.name === "AbortError";
      if (attempt < maxRetries) {
        await sleepImpl(computeRetryDelayMs(attempt, null, random));
        continue;
      }
      throw new ChatError(
        timedOut ? "AI request timed out" : "AI request failed after retries",
        timedOut ? "timeout" : "transient",
      );
    } finally {
      clearTimeout(timer);
    }

    const kind = classifyResponse(res.status, bodyText);

    if (kind === "ok") {
      const output = extractOutput(bodyText);
      if (output) {
        return { output, model, attempts, retried: attempts > 1 };
      }
      // Malformed or unexpected 200 response - retry when safe.
      if (attempt < maxRetries) {
        await sleepImpl(computeRetryDelayMs(attempt, null, random));
        continue;
      }
      throw new ChatError("AI returned an empty response", "transient", res.status);
    }

    if (kind === "rate_limit") {
      const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
      if (attempt < maxRetries) {
        await sleepImpl(computeRetryDelayMs(attempt, retryAfter, random));
        continue;
      }
      throw new ChatError("AI rate limit reached", "rate_limit", res.status);
    }

    if (kind === "transient") {
      if (attempt < maxRetries) {
        await sleepImpl(computeRetryDelayMs(attempt, null, random));
        continue;
      }
      throw new ChatError("AI provider error", "transient", res.status);
    }

    if (kind === "auth") {
      throw new ChatError("AI credentials invalid", "auth", res.status);
    }
    if (kind === "model_invalid") {
      throw new ChatError("AI model unavailable", "model_invalid", res.status);
    }
    throw new ChatError("AI request failed", "fatal", res.status);
  }

  throw new ChatError("AI request failed", "fatal");
}

// Generate text with automatic model fallback:
// - resolves the initial model from the cached model list (or the configured
//   preference when discovery is unavailable)
// - if Groq rejects the selected model, refreshes the list immediately and
//   retries once with the next suitable model
// - never retries forever and never hides persistent failures
export async function generateText(options: GenerateOptions): Promise<CompletionResult> {
  const {
    apiKey,
    preferredModel = DEFAULT_MODEL,
    endpoint = DEFAULT_ENDPOINT,
    now,
    ...completion
  } = options;

  const available = await getAvailableModels({
    apiKey,
    endpoint,
    now,
    fetchImpl: options.fetchImpl,
  });
  let model = selectModel(available, preferredModel);

  for (let attempt = 0; attempt <= 1; attempt++) {
    if (!model) {
      // Discovery is unavailable - trust the operator-configured model.
      model = preferredModel;
    }
    if (!model) {
      throw new ChatError("No AI model available", "no_model");
    }

    try {
      return await chatCompletion({ ...completion, apiKey, endpoint, model });
    } catch (e) {
      const modelRejected = e instanceof ChatError && e.code === "model_invalid";
      if (modelRejected && attempt === 0) {
        const fresh = await getAvailableModels({
          apiKey,
          endpoint,
          forceRefresh: true,
          fetchImpl: options.fetchImpl,
        });
        model = selectModel(
          fresh.filter((id) => id !== model),
          preferredModel,
        );
        continue;
      }
      throw e;
    }
  }

  throw new ChatError("AI request failed", "fatal");
}
