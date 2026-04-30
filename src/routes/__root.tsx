import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";

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
          "Loopr by The MVP Guy. Lightweight, AI-assisted pipeline tracker. Sheet, Kanban, and daily briefings — built for high-touch outbound.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
});

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
