import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/health")({
  component: HealthCheck,
});

function HealthCheck() {
  const [dbStatus, setDbStatus] = useState<"checking" | "ok" | "error">("checking");

  useEffect(() => {
    (async () => {
      const { error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .limit(1);
      setDbStatus(error ? "error" : "ok");
    })();
  }, []);

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
              : "Database connection failed"}
        </p>
      </div>
    </div>
  );
}
