import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import { AlertTriangle, RefreshCw } from "lucide-react";

import appCss from "../styles.css?url";

interface RouterCtx {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterCtx>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Loopr - A focused CRM that thinks with you" },
      {
        name: "description",
        content:
          "Loopr by The MVP Guy. Lightweight, AI-assisted pipeline tracker. Sheet, Kanban, and daily briefings  built for high-touch outbound.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  errorComponent: ErrorBoundary,
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
});

function ErrorBoundary({ error }: { error: Error }) {
  const isAuthError = error.message?.includes("Unauthorized") || error.message?.includes("auth");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="brutal-card p-10 text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-[var(--destructive)] border-[3px] border-black flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-white" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">
          {isAuthError ? "Session Expired" : "Something went wrong"}
        </h1>
        <p className="mt-2 text-foreground/70 text-sm">
          {isAuthError
            ? "Your session has expired. Please sign in again."
            : "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="brutal-btn inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Reload
        </button>
        {isAuthError && (
          <a href="/auth" className="block mt-4 text-sm font-bold underline">
            Go to sign in
          </a>
        )}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="brutal-card p-10 text-center max-w-md">
        <div className="text-7xl font-extrabold text-foreground">404</div>
        <p className="mt-2 text-foreground/70">This page didn't make the pipeline.</p>
        <a href="/" className="brutal-btn inline-block mt-6 px-5 py-2.5 text-sm">
          Go home
        </a>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
