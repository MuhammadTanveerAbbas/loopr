import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { useState } from "react";
import {
  LayoutDashboard,
  Table2,
  Kanban,
  Heart,
  CheckCircle2,
  Settings,
  LogOut,
  Brain,
  Trash2,
  Activity,
  Upload,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LoopMark } from "@/components/ui/logo";

const main = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Table2 },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/nurture", label: "Nurture", icon: Heart },
  { to: "/closed", label: "Closed", icon: CheckCircle2 },
  { to: "/import", label: "Import CSV", icon: Upload },
];
const ai = [{ to: "/ai", label: "AI Workspace", icon: Brain }];
const account = [
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/trash", label: "Trash", icon: Trash2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

function SidebarNav({ onNav }: { onNav?: () => void }) {
  const loc = useLocation();
  const nav = useNavigate();
  const { signOut } = useAuth();

  const NavItem = ({
    to,
    label,
    icon: Icon,
  }: {
    to: string;
    label: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number | string }>;
  }) => {
    const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        onClick={onNav}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          active ? "neu-inset-sm text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      <Link to="/dashboard" className="flex items-center gap-3 px-2 py-3 group" onClick={onNav}>
        <LoopMark size={40} className="transition-transform group-hover:rotate-[-6deg]" />
        <div className="leading-none">
          <div className="font-extrabold text-foreground text-[18px]">Loopr</div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-foreground/60 mt-1">
            by The MVP Guy
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-semibold tracking-wider text-muted-foreground px-4 mb-1">
          MAIN
        </div>
        {main.map((i) => (
          <NavItem key={i.to} {...i} />
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-semibold tracking-wider text-muted-foreground px-4 mb-1">
          AI
        </div>
        {ai.map((i) => (
          <NavItem key={i.to} {...i} />
        ))}
      </div>

      <div className="flex flex-col gap-1 mt-auto">
        <div className="text-[10px] font-extrabold tracking-wider text-foreground/60 px-4 mb-1 uppercase">
          Account
        </div>
        {account.map((i) => (
          <NavItem key={i.to} {...i} />
        ))}
        <button
          onClick={async () => {
            await signOut();
            nav({ to: "/auth" });
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-foreground/80 hover:text-foreground hover:bg-black/5 transition-all"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={2.5} />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 neu-pressable rounded-xl p-2.5 bg-background"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[280px] h-full bg-background p-5 flex flex-col gap-6 overflow-y-auto">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 neu-pressable rounded-xl p-2"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarNav onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <aside className="hidden md:flex flex-col w-[240px] h-screen sticky top-0 p-5 gap-6 bg-background">
        <SidebarNav />
      </aside>
    </>
  );
}
