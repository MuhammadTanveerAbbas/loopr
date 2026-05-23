import { AlertTriangle, RefreshCw } from "lucide-react";

export function ErrorFallback({
  error,
  reset,
  message = "Something went wrong",
}: {
  error: Error;
  reset: () => void;
  message?: string;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="neu-raised-lg rounded-3xl p-8 max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-destructive border-[3px] border-black flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-white" strokeWidth={3} />
        </div>
        <h2 className="text-lg font-bold text-foreground">{message}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message.includes("auth") ? "Your session may have expired." : "Please try again."}
        </p>
        <button
          onClick={reset}
          className="neu-pressable rounded-xl px-5 py-2.5 text-sm font-semibold mt-5 inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
