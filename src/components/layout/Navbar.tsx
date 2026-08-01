import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useRef, useState, useEffect, useCallback } from "react";
import { LogOut, Settings, ChevronDown, Search } from "lucide-react";
import { commandPaletteStore } from "@/lib/command-palette-store";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads":     "Leads",
  "/pipeline":  "Pipeline",
  "/nurture":   "Nurture",
  "/closed":    "Closed Won",
  "/import":    "Import CSV",
  "/ai":        "AI Workspace",
  "/activity":  "Activity",
  "/trash":     "Trash",
  "/settings":  "Settings",
};

export function Navbar() {
  const loc = useLocation();
  const nav = useNavigate();
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPage = pageTitles[loc.pathname] || "Dashboard";
  const close = useCallback(() => setDropdownOpen(false), []);
  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const avatarLetter = user?.email?.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [close]);

  return (
    <header className="sticky top-0 z-40 bg-background border-b-[3px] border-black">
      <div className="flex items-center justify-between h-14 px-4 md:px-6 pl-14 md:pl-6">

        <h1 className="text-sm font-extrabold text-foreground truncate md:hidden">
          {currentPage}
        </h1>

        <div className="flex items-center gap-2 ml-auto">
          {/* Search — hidden on mobile */}
          <button
            onClick={() => commandPaletteStore.setOpen(true)}
            className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-background border-2 border-black rounded-xl px-3 py-1.5 shadow-[0_2px_0_#0a0a0a] hover:shadow-none hover:translate-y-px transition-all"
            aria-label="Search (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Search</span>
            <kbd className="text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded font-bold hidden md:inline">⌘K</kbd>
          </button>

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 border-2 border-black rounded-xl px-2 py-1.5 bg-background shadow-[0_2px_0_#0a0a0a] hover:shadow-none hover:translate-y-px transition-all"
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
            >
              <div className="w-7 h-7 rounded-full bg-brand-yellow border-2 border-black flex items-center justify-center text-[11px] font-extrabold shrink-0">
                {avatarLetter}
              </div>
              <span className="text-xs font-bold text-foreground hidden md:block max-w-[100px] truncate">
                {displayName}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-background border-2 border-black rounded-2xl shadow-[0_6px_0_#0a0a0a] overflow-hidden z-50 animate-slide-up">
                {/* User info header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-black bg-brand-yellow/30">
                  <div className="w-8 h-8 rounded-full bg-brand-yellow border-2 border-black flex items-center justify-center text-sm font-extrabold shrink-0">
                    {avatarLetter}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-foreground truncate">{displayName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { nav({ to: "/settings" }); close(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-foreground rounded-xl hover:bg-foreground/[0.06] transition-colors"
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    Settings
                  </button>
                  <button
                    onClick={() => { commandPaletteStore.setOpen(true); close(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-foreground rounded-xl hover:bg-foreground/[0.06] transition-colors sm:hidden"
                  >
                    <Search className="h-4 w-4 shrink-0" />
                    Search
                  </button>
                </div>

                <div className="p-1.5 border-t-2 border-black">
                  <button
                    onClick={() => { signOut(); close(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-destructive rounded-xl hover:bg-destructive/[0.07] transition-colors"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
