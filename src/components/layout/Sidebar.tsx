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
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LoopMark } from "@/components/ui/logo";

const sections = [
  {
    label: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "G D" },
      { to: "/leads", label: "Leads", icon: Table2, shortcut: "G L" },
      { to: "/pipeline", label: "Pipeline", icon: Kanban, shortcut: "G P" },
      { to: "/nurture", label: "Nurture", icon: Heart, shortcut: "G N" },
      { to: "/closed", label: "Closed", icon: CheckCircle2, shortcut: "G C" },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "/import", label: "Import CSV", icon: Upload, shortcut: "G I" },
      { to: "/ai", label: "AI Workspace", icon: Brain, shortcut: "G A" },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/activity", label: "Activity", icon: Activity, shortcut: "G V" },
      { to: "/trash", label: "Trash", icon: Trash2, shortcut: "G T" },
      { to: "/settings", label: "Settings", icon: Settings, shortcut: "G S" },
    ],
  },
];

function SidebarNav({ onNav }: { onNav?: () => void }) {
  const loc = useLocation();
  const nav = useNavigate();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const NavItem = ({
    to,
    label,
    icon: Icon,
    shortcut,
  }: {
    to: string;
    label: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number | string }>;
    shortcut?: string;
  }) => {
    const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        onClick={onNav}
        className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          active
            ? "neu-inset-sm text-primary bg-background"
            : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
        }`}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full" />
        )}
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.5 : 2} />
        <span className="truncate">{label}</span>
        {shortcut && !active && (
          <kbd className="ml-auto text-[9px] font-bold text-muted-foreground/50 bg-foreground/5 px-1.5 py-0.5 rounded hidden lg:inline">
            {shortcut}
          </kbd>
        )}
      </Link>
    );
  };

  const toggleSection = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      <Link to="/dashboard" className="flex items-center gap-3 px-2 py-3 group" onClick={onNav}>
        <LoopMark size={36} className="transition-transform group-hover:rotate-[-6deg]" />
        <div className="leading-none">
          <div className="font-extrabold text-foreground text-[16px]">Loopr</div>
          <div className="text-[8px] font-bold uppercase tracking-wider text-foreground/60 mt-0.5">
            CRM
          </div>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin">
        {sections.map((section) => {
          const isCollapsed = collapsed[section.label];
          return (
            <div key={section.label} className="space-y-0.5">
              <button
                onClick={() => toggleSection(section.label)}
                className="flex items-center justify-between w-full px-4 py-1"
              >
                <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {section.label}
                </div>
                <ChevronDown
                  className={`h-3 w-3 text-muted-foreground/50 transition-transform duration-200 ${
                    isCollapsed ? "-rotate-90" : ""
                  }`}
                />
              </button>
              {!isCollapsed && section.items.map((i) => <NavItem key={i.to} {...i} />)}
            </div>
          );
        })}
      </div>

      <div className="border-t-2 border-black pt-3 space-y-1">
        {user && (
          <div className="flex items-center gap-2 px-4 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-foreground/10 border-2 border-black flex items-center justify-center text-[10px] font-extrabold shrink-0">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                {user.email || "User"}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={async () => {
            await signOut();
            nav({ to: "/auth" });
          }}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-foreground/80 hover:text-foreground hover:bg-destructive/5 transition-all"
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
          <aside className="relative w-[280px] h-full bg-background p-5 flex flex-col gap-6 overflow-y-auto animate-slide-in-left">
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

      <aside className="hidden md:flex flex-col w-[240px] h-screen sticky top-0 p-4 gap-5 bg-background border-r-3 border-black">
        <SidebarNav />
      </aside>
    </>
  );
}
