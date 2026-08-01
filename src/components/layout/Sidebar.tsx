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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LoopMark } from "@/components/ui/logo";

const sections = [
  {
    label: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "G D" },
      { to: "/leads",     label: "Leads",     icon: Table2,          shortcut: "G L" },
      { to: "/pipeline",  label: "Pipeline",  icon: Kanban,          shortcut: "G P" },
      { to: "/nurture",   label: "Nurture",   icon: Heart,           shortcut: "G N" },
      { to: "/closed",    label: "Closed",    icon: CheckCircle2,    shortcut: "G C" },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "/import", label: "Import CSV",   icon: Upload, shortcut: "G I" },
      { to: "/ai",     label: "AI Workspace", icon: Brain,  shortcut: "G A" },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/activity", label: "Activity", icon: Activity, shortcut: "G V" },
      { to: "/trash",    label: "Trash",    icon: Trash2,   shortcut: "G T" },
      { to: "/settings", label: "Settings", icon: Settings, shortcut: "G S" },
    ],
  },
];

function Tooltip({ label, shortcut }: { label: string; shortcut?: string }) {
  return (
    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
      <div className="bg-foreground text-background text-xs font-bold px-2.5 py-1.5 rounded-lg border-2 border-black shadow-[0_3px_0_#0a0a0a] whitespace-nowrap">
        {label}
        {shortcut && <span className="ml-2 text-background/50 text-[10px]">{shortcut}</span>}
      </div>
    </div>
  );
}

function SidebarNav({
  collapsed,
  onCollapse,
  onNav,
}: {
  collapsed: boolean;
  onCollapse?: () => void;
  onNav?: () => void;
}) {
  const loc = useLocation();
  const nav = useNavigate();
  const { signOut, user } = useAuth();

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
      <div className="relative group/tip">
        <Link
          to={to}
          onClick={onNav}
          className={`relative flex items-center gap-2.5 rounded-xl text-sm font-bold transition-all duration-150
            ${collapsed ? "justify-center px-0 py-2.5 w-full" : "px-3 py-2"}
            ${active
              ? "bg-brand-yellow border-2 border-black shadow-[0_3px_0_#0a0a0a] text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]"
            }`}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.5 : 2} aria-hidden />
          {!collapsed && <span className="truncate">{label}</span>}
          {!collapsed && shortcut && !active && (
            <kbd className="ml-auto text-[9px] font-bold text-muted-foreground/40 bg-foreground/[0.06] px-1.5 py-0.5 rounded hidden lg:inline">
              {shortcut}
            </kbd>
          )}
        </Link>
        {collapsed && <Tooltip label={label} shortcut={shortcut} />}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Logo — no bottom divider */}
      <Link
        to="/dashboard"
        onClick={onNav}
        className={`flex items-center gap-2.5 py-2 mb-2 group shrink-0 ${collapsed ? "justify-center px-0" : "px-3"}`}
      >
        <LoopMark size={30} className="transition-transform group-hover:rotate-[-6deg] shrink-0" />
        {!collapsed && (
          <div className="leading-none">
            <div className="font-extrabold text-foreground text-sm tracking-tight">Loopr</div>
            <div className="text-[8px] font-bold uppercase tracking-wider text-foreground/60 mt-0.5">CRM</div>
          </div>
        )}
      </Link>

      {/* Nav sections */}
      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto no-scrollbar">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            {!collapsed ? (
              <div className="px-3 pt-0.5 text-[10px] font-extrabold tracking-[0.12em] text-muted-foreground/70 uppercase select-none">
                {section.label}
              </div>
            ) : (
              <div className="h-px bg-foreground/10 mx-2 my-1" />
            )}
            {section.items.map((i) => (
              <NavItem key={i.to} {...i} />
            ))}
          </div>
        ))}
      </div>

      {/* Bottom area: user + collapse toggle + logout */}
      <div className="shrink-0 border-t-2 border-black pt-2 mt-2 space-y-1">
        {/* User info */}
        {user && !collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-brand-yellow border-2 border-black flex items-center justify-center text-[11px] font-extrabold shrink-0">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-foreground truncate">
                {user.user_metadata?.name || user.email?.split("@")[0] || "User"}
              </div>
              <div className="text-[9px] text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
        )}

        {/* Collapse toggle — only on desktop sidebar (onCollapse provided) */}
        {onCollapse && (
          <div className="relative group/tip">
            <button
              onClick={onCollapse}
              className={`flex items-center gap-2.5 w-full rounded-xl text-sm font-bold text-muted-foreground
                hover:text-foreground hover:bg-foreground/[0.06] transition-all
                ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"}`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed
                ? <PanelLeftOpen className="h-4 w-4 shrink-0" />
                : <PanelLeftClose className="h-4 w-4 shrink-0" />
              }
              {!collapsed && <span>Collapse</span>}
            </button>
            {collapsed && <Tooltip label="Expand sidebar" />}
          </div>
        )}

        {/* Logout */}
        <div className="relative group/tip">
          <button
            onClick={async () => { await signOut(); nav({ to: "/auth" }); }}
            className={`flex items-center gap-2.5 w-full rounded-xl text-sm font-bold text-muted-foreground
              hover:text-destructive hover:bg-destructive/[0.06] transition-all
              ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"}`}
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
            {!collapsed && <span>Logout</span>}
          </button>
          {collapsed && <Tooltip label="Logout" />}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile hamburger — inside navbar area, no overlap */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3.5 left-3.5 z-50 w-8 h-8 rounded-xl bg-background border-2 border-black shadow-[0_2px_0_#0a0a0a] flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[272px] h-full bg-background border-r-[3px] border-black p-4 flex flex-col overflow-y-auto no-scrollbar animate-slide-in-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-xl border-2 border-black bg-background shadow-[0_2px_0_#0a0a0a] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarNav collapsed={false} onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 p-4 bg-background border-r-[3px] border-black shrink-0 transition-all duration-300
          ${collapsed ? "w-[68px]" : "w-[248px]"}`}
      >
        <SidebarNav
          collapsed={collapsed}
          onCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>
    </>
  );
}
