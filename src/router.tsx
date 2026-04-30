import { createRouter, useRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  // Don't expose raw error.message to users — it can leak internal details.
  if (typeof console !== "undefined") console.error("Route error:", error);
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="neu-raised-lg rounded-3xl p-8 max-w-md text-center">
        <h1 className="text-xl font-bold text-foreground">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. Please try again — if it keeps happening, refresh the page.
        </p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 neu-pressable rounded-xl px-5 py-2.5 text-sm font-semibold text-primary"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
  });
  return createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });
};
