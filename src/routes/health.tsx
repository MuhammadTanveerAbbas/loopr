import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/health")({
  component: HealthCheck,
});

const CHECK_TIMEOUT_MS = 10_000;

type Status = "checking" | "ok" | "error";

function HealthCheck() {
  const [dbStatus, setDbStatus] = useState<Status>("checking");
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  const runCheck = useCallback(async () => {
    setDbStatus("checking");
    try {
      const result = await Promise.race([
        supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1),
        // Fail clearly instead of hanging when Supabase is unreachable.
        new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), CHECK_TIMEOUT_MS)),
      ]);
      setDbStatus(result === "timeout" || result.error ? "error" : "ok");
    } catch {
      setDbStatus("error");
    } finally {
      setCheckedAt(Date.now());
    }
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  const status = dbStatus === "ok";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center">
        <div className={`text-6xl mb-4 ${status ? "" : "text-amber-500"}`}>
          {dbStatus === "checking" ? "..." : status ? "✓" : "✗"}
        </div>
        <h1 className="text-xl font-bold text-foreground">
          {dbStatus === "checking" ? "Checking..." : status ? "Loopr is healthy" : "Degraded"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {dbStatus === "checking"
            ? "Verifying database connectivity..."
            : status
              ? `Server: running · Database: connected · ${new Date().toISOString()}`
              : "Database connection failed or timed out"}
        </p>
        <button
          onClick={runCheck}
          disabled={dbStatus === "checking"}
          className="brutal-btn inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-sm disabled:opacity-50"
        >
          Re-check
        </button>
        {checkedAt && (
          <p className="text-xs text-muted-foreground mt-3">
            Last checked: {new Date(checkedAt).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
