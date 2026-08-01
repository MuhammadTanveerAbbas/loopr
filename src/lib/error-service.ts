const isDev = import.meta.env.DEV;

interface ErrorPayload {
  message: string;
  source?: string;
  context?: Record<string, unknown>;
  level?: "error" | "warn" | "info";
  userId?: string;
  timestamp?: string;
}

function formatLog(payload: ErrorPayload): string[] {
  const ts = payload.timestamp ?? new Date().toISOString();
  const parts = [
    `[${ts}]`,
    `[${payload.level ?? "error"}]`,
    `[${payload.source ?? "app"}]`,
    payload.message,
  ];
  if (payload.userId) parts.push(`[user:${payload.userId}]`);
  return parts;
}

const log = {
  error(payload: ErrorPayload) {
    const parts = formatLog({ ...payload, level: "error", timestamp: new Date().toISOString() });
    console.error(...parts, payload.context ?? "");
  },
  warn(payload: ErrorPayload) {
    const parts = formatLog({ ...payload, level: "warn", timestamp: new Date().toISOString() });
    console.warn(...parts, payload.context ?? "");
  },
  info(payload: ErrorPayload) {
    if (isDev) {
      const parts = formatLog({ ...payload, level: "info", timestamp: new Date().toISOString() });
      console.info(...parts, payload.context ?? "");
    }
  },
};

export function captureError(error: unknown, source: string, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : "Unknown error";
  log.error({ message, source, context, level: "error" });
}

export function captureWarning(message: string, source: string, context?: Record<string, unknown>) {
  log.warn({ message, source, context, level: "warn" });
}

const KNOWN_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Invalid email or password. Please try again.",
  "Email not confirmed": "Please confirm your email address before signing in.",
  "User already registered": "An account with this email already exists.",
  "Password should be at least 6 characters": "Password must be at least 6 characters.",
  rate_limit: "Too many attempts. Please wait a moment and try again.",
  Unauthorized: "Your session has expired. Please sign in again.",
  "JWT expired": "Your session has expired. Please sign in again.",
  "Invalid token": "Your session has expired. Please sign in again.",
  "service_role key": "Authentication service unavailable. Please try again later.",
};

export function sanitizeErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : error &&
            typeof error === "object" &&
            "message" in error &&
            typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : String(error ?? fallback);
  for (const [key, friendly] of Object.entries(KNOWN_ERROR_MAP)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return friendly;
  }
  // Return the real message when it's short enough to show safely, otherwise fall back.
  if (msg.length > 0 && msg.length <= 140 && !msg.includes("[object")) return msg;
  return fallback;
}
