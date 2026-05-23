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
