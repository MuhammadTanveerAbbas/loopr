import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_ENDPOINT,
  MAX_RETRIES,
  MODEL_CACHE_TTL_MS,
  chatCompletion,
  computeRetryDelayMs,
  generateText,
  getAvailableModels,
  resetModelCache,
  selectModel,
} from "../../supabase/functions/AI-Tasks/ai-client";

const MODELS_URL = DEFAULT_ENDPOINT.replace(/\/chat\/completions\/?$/, "/models");

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function hang(init?: RequestInit): Promise<Response> {
  return new Promise((_, reject) => {
    const signal = init?.signal;
    if (!signal) return;
    const abortError = Object.assign(new Error("Aborted"), { name: "AbortError" });
    if (signal.aborted) {
      reject(abortError);
      return;
    }
    signal.addEventListener("abort", () => reject(abortError));
  });
}

type FetchCall = { url: string; init?: RequestInit };
let calls: FetchCall[] = [];
let handler: ((url: string, init?: RequestInit) => Response | Promise<Response>) | null = null;

const fakeFetch = (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const u = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
  calls.push({ url: u, init });
  if (!handler) return Promise.reject(new Error("No fetch handler configured"));
  return Promise.resolve().then(() => handler(u, init));
};

const noSleep = (): Promise<void> => Promise.resolve();
const noJitter = (): number => 0;

beforeEach(() => {
  resetModelCache();
  calls = [];
  handler = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Groq model discovery & cache", () => {
  it("discovers and parses the available model list", async () => {
    handler = () =>
      jsonResponse({
        object: "list",
        data: [{ id: "llama-3.3-70b-versatile" }, { id: "llama-3.1-8b-instant" }],
      });

    const ids = await getAvailableModels({ apiKey: "test-key", fetchImpl: fakeFetch });
    expect(ids).toEqual(["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(MODELS_URL);
  });

  it("caches the list and does not refetch within the TTL", async () => {
    handler = () => jsonResponse({ data: [{ id: "m1" }] });

    await getAvailableModels({ apiKey: "k", fetchImpl: fakeFetch });
    const second = await getAvailableModels({ apiKey: "k", fetchImpl: fakeFetch });

    expect(second).toEqual(["m1"]);
    expect(calls).toHaveLength(1);
  });

  it("refetches when the cache TTL expires", async () => {
    let model = "m1";
    handler = () => jsonResponse({ data: [{ id: model }] });

    await getAvailableModels({ apiKey: "k", fetchImpl: fakeFetch, now: 0 });
    model = "m2";
    const ids = await getAvailableModels({
      apiKey: "k",
      fetchImpl: fakeFetch,
      now: MODEL_CACHE_TTL_MS + 1,
    });

    expect(ids).toEqual(["m2"]);
    expect(calls).toHaveLength(2);
  });

  it("refreshes the list immediately when forced", async () => {
    let model = "m1";
    handler = () => jsonResponse({ data: [{ id: model }] });

    await getAvailableModels({ apiKey: "k", fetchImpl: fakeFetch });
    model = "m2";
    const ids = await getAvailableModels({ apiKey: "k", fetchImpl: fakeFetch, forceRefresh: true });

    expect(ids).toEqual(["m2"]);
    expect(calls).toHaveLength(2);
  });

  it("returns a previous cache when a refresh fails", async () => {
    handler = () => jsonResponse({ data: [{ id: "m1" }] });
    await getAvailableModels({ apiKey: "k", fetchImpl: fakeFetch });

    handler = () => jsonResponse({ error: { message: "boom" } }, 500);
    const ids = await getAvailableModels({ apiKey: "k", fetchImpl: fakeFetch, forceRefresh: true });

    expect(ids).toEqual(["m1"]);
  });
});

describe("Groq model selection", () => {
  it("prefers the configured model when it is available", () => {
    const ids = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];
    expect(selectModel(ids, "llama-3.3-70b-versatile")).toBe("llama-3.3-70b-versatile");
  });

  it("falls back to a compatible model when the preferred one is unavailable", () => {
    expect(selectModel(["llama-3.1-8b-instant"], "llama-3.3-70b-versatile")).toBe(
      "llama-3.1-8b-instant",
    );
  });

  it("picks a known preference deterministically before unknown models", () => {
    expect(
      selectModel(["some-brand-new-model", "llama3-70b-8192"], "llama-3.3-70b-versatile"),
    ).toBe("llama3-70b-8192");
  });

  it("returns null when no models are available", () => {
    expect(selectModel([], "llama-3.3-70b-versatile")).toBeNull();
  });
});

describe("Groq retry delay (backoff, jitter, Retry-After)", () => {
  it("computes bounded exponential backoff with no jitter", () => {
    expect(computeRetryDelayMs(0, null, noJitter)).toBe(1000);
    expect(computeRetryDelayMs(1, null, noJitter)).toBe(2000);
    expect(computeRetryDelayMs(2, null, noJitter)).toBe(4000);
    expect(computeRetryDelayMs(5, null, noJitter)).toBe(10000);
  });

  it("adds jitter to the backoff", () => {
    const withJitter = computeRetryDelayMs(0, null, () => 1);
    expect(withJitter).toBe(1250);
    expect(withJitter).toBeGreaterThan(computeRetryDelayMs(0, null, noJitter));
  });

  it("respects Retry-After and caps it", () => {
    expect(computeRetryDelayMs(0, 5, noJitter)).toBe(5000);
    expect(computeRetryDelayMs(0, 120, noJitter)).toBe(60000);
  });
});

describe("Groq chat completion resilience", () => {
  it("succeeds on a normal request", async () => {
    handler = () => jsonResponse({ choices: [{ message: { content: "All good" } }] });

    const result = await chatCompletion({
      apiKey: "k",
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "hi" }],
      fetchImpl: fakeFetch,
    });

    expect(result.output).toBe("All good");
    expect(result.retried).toBe(false);
    expect(result.attempts).toBe(1);
  });

  it("respects Retry-After on HTTP 429 and recovers", async () => {
    let chatCalls = 0;
    handler = () => {
      if (calls.length === 1) {
        chatCalls += 1;
        return jsonResponse({ error: { message: "rate limit" } }, 429, {
          "retry-after": "0",
        });
      }
      return jsonResponse({ choices: [{ message: { content: "recovered" } }] });
    };

    const result = await chatCompletion({
      apiKey: "k",
      model: "m",
      messages: [{ role: "user", content: "hi" }],
      fetchImpl: fakeFetch,
      sleepImpl: noSleep,
    });

    expect(result.output).toBe("recovered");
    expect(result.retried).toBe(true);
    expect(chatCalls).toBe(1);
  });

  it("stops retrying after the maximum and fails with a controlled rate_limit error", async () => {
    handler = () => jsonResponse({ error: { message: "rate limit" } }, 429, { "retry-after": "0" });

    await expect(
      chatCompletion({
        apiKey: "k",
        model: "m",
        messages: [{ role: "user", content: "hi" }],
        fetchImpl: fakeFetch,
        sleepImpl: noSleep,
        maxRetries: MAX_RETRIES,
      }),
    ).rejects.toMatchObject({ code: "rate_limit" });

    const chatCalls = calls.filter((c) => c.url === DEFAULT_ENDPOINT);
    expect(chatCalls).toHaveLength(MAX_RETRIES + 1);
  });

  it("retries a transient HTTP 503 and succeeds", async () => {
    let chatCalls = 0;
    handler = () => {
      chatCalls += 1;
      if (chatCalls === 1) {
        return jsonResponse({ error: { message: "server error" } }, 503);
      }
      return jsonResponse({ choices: [{ message: { content: "recovered" } }] });
    };

    const result = await chatCompletion({
      apiKey: "k",
      model: "m",
      messages: [{ role: "user", content: "hi" }],
      fetchImpl: fakeFetch,
      sleepImpl: noSleep,
    });

    expect(result.output).toBe("recovered");
    expect(result.retried).toBe(true);
  });

  it("retries network failures and fails gracefully after the limit", async () => {
    let chatCalls = 0;
    handler = () => {
      chatCalls += 1;
      throw new Error("network down");
    };

    await expect(
      chatCompletion({
        apiKey: "k",
        model: "m",
        messages: [{ role: "user", content: "hi" }],
        fetchImpl: fakeFetch,
        sleepImpl: noSleep,
        maxRetries: 1,
      }),
    ).rejects.toMatchObject({ code: "transient" });

    expect(chatCalls).toBe(2);
  });

  it("throws a controlled timeout error when the request hangs", async () => {
    handler = (url, init) => {
      if (url === MODELS_URL) return jsonResponse({ data: [{ id: "m" }] });
      return hang(init);
    };

    await expect(
      chatCompletion({
        apiKey: "k",
        model: "m",
        messages: [{ role: "user", content: "hi" }],
        fetchImpl: fakeFetch,
        timeoutMs: 20,
        maxRetries: 0,
      }),
    ).rejects.toMatchObject({ code: "timeout" });
  });

  it("treats a malformed 200 response as a failure", async () => {
    handler = () => new Response("not-json", { status: 200 });

    await expect(
      chatCompletion({
        apiKey: "k",
        model: "m",
        messages: [{ role: "user", content: "hi" }],
        fetchImpl: fakeFetch,
        sleepImpl: noSleep,
        maxRetries: 0,
      }),
    ).rejects.toMatchObject({ code: "transient" });
  });

  it("fails immediately on auth errors without retrying", async () => {
    handler = () => jsonResponse({ error: { message: "bad key" } }, 401);

    await expect(
      chatCompletion({
        apiKey: "k",
        model: "m",
        messages: [{ role: "user", content: "hi" }],
        fetchImpl: fakeFetch,
        maxRetries: MAX_RETRIES,
      }),
    ).rejects.toMatchObject({ code: "auth" });

    expect(calls.filter((c) => c.url === DEFAULT_ENDPOINT)).toHaveLength(1);
  });
});

describe("Groq model fallback in generateText", () => {
  it("auto-falls back to another model when the selected model is invalid", async () => {
    let modelsCalls = 0;
    handler = (url, init) => {
      if (url === MODELS_URL) {
        modelsCalls += 1;
        return modelsCalls === 1
          ? jsonResponse({ data: [{ id: "llama-3.3-70b-versatile" }] })
          : jsonResponse({
              data: [{ id: "llama-3.3-70b-versatile" }, { id: "llama-3.1-8b-instant" }],
            });
      }
      const body = JSON.parse((init?.body as string) ?? "{}") as { model?: string };
      if (body.model === "llama-3.3-70b-versatile") {
        return jsonResponse({ error: { message: "The model does not exist" } }, 404);
      }
      return jsonResponse({ choices: [{ message: { content: "hello" } }] });
    };

    const result = await generateText({
      apiKey: "k",
      preferredModel: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "hi" }],
      fetchImpl: fakeFetch,
      sleepImpl: noSleep,
    });

    expect(result.output).toBe("hello");
    expect(result.model).toBe("llama-3.1-8b-instant");
    expect(modelsCalls).toBe(2);
  });

  it("returns a controlled error when no alternative model exists", async () => {
    handler = (url) => {
      if (url === MODELS_URL) return jsonResponse({ data: [{ id: "llama-3.3-70b-versatile" }] });
      return jsonResponse({ error: { message: "Model not found" } }, 404);
    };

    await expect(
      generateText({
        apiKey: "k",
        preferredModel: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "hi" }],
        fetchImpl: fakeFetch,
        sleepImpl: noSleep,
        maxRetries: 0,
      }),
    ).rejects.toMatchObject({ code: "model_invalid" });
  });

  it("uses the configured model when the model list cannot be fetched", async () => {
    handler = (url) => {
      if (url === MODELS_URL) return jsonResponse({ error: { message: "nope" } }, 500);
      return jsonResponse({ choices: [{ message: { content: "works" } }] });
    };

    const result = await generateText({
      apiKey: "k",
      preferredModel: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "hi" }],
      fetchImpl: fakeFetch,
      sleepImpl: noSleep,
    });

    expect(result.output).toBe("works");
  });

  it("fails gracefully when no model can be resolved", async () => {
    handler = () => jsonResponse({ data: [] });

    await expect(
      generateText({
        apiKey: "k",
        preferredModel: "",
        messages: [{ role: "user", content: "hi" }],
        fetchImpl: fakeFetch,
        sleepImpl: noSleep,
      }),
    ).rejects.toMatchObject({ code: "no_model" });
  });

  it("never leaks the API key in errors", async () => {
    const secret = "sk-super-secret-123456";
    handler = (url) => {
      if (url === MODELS_URL) return jsonResponse({ data: [] });
      throw new Error(`provider echoed: ${secret}`);
    };

    try {
      await generateText({
        apiKey: secret,
        preferredModel: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "hi" }],
        fetchImpl: fakeFetch,
        maxRetries: 0,
      });
      expect.unreachable("expected generateText to reject");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      expect(message).not.toContain(secret);
      expect(message).not.toContain("sk-super-secret");
    }
  });
});
