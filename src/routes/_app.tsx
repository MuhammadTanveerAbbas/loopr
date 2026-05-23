import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { OnboardingModal } from "@/components/layout/OnboardingModal";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="brutal-card px-5 py-3 text-sm font-bold">Loading…</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 pt-16 md:pt-8">
        <Outlet />
      </main>
      <CommandPalette />
      <OnboardingModal />
    </div>
  );
}
