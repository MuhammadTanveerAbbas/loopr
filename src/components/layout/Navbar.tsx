import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useRef, useState, useEffect } from "react";
import { LogOut, Settings, User, ChevronDown, Search } from "lucide-react";
import { LoopMark } from "@/components/ui/logo";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/pipeline": "Pipeline",
  "/nurture": "Nurture",
  "/closed": "Closed Won",
  "/import": "Import CSV",
  "/ai": "AI Workspace",
  "/activity": "Activity",
  "/trash": "Trash",
  "/settings": "Settings",
};

export function Navbar() {
  const loc = useLocation();
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPage = pageTitles[loc.pathname] || "Dashboard";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-background border-b-3 border-black">
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-4">
          <div className="md:hidden flex items-center gap-2">
            <LoopMark size={32} />
            <span className="font-extrabold text-lg text-foreground">Loopr</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{currentPage}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-background border-2 border-black rounded-xl px-3 py-1.5 hover:bg-foreground/5 transition-colors">
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded font-bold">⌘K</kbd>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 border-2 border-black rounded-xl px-3 py-1.5 bg-background hover:bg-foreground/5 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-foreground/10 border-2 border-black flex items-center justify-center text-[10px] font-extrabold">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-xs font-semibold text-foreground hidden sm:block max-w-[100px] truncate">
                {user?.email || "User"}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-background border-2 border-black rounded-xl shadow-[0_4px_0_#0A0A0A] overflow-hidden z-50">
                <div className="px-3 py-2.5 border-b-2 border-black">
                  <div className="text-xs font-semibold text-foreground truncate">
                    {user?.email || "User"}
                  </div>
                </div>
                <button
                  onClick={() => {
                    window.location.href = "/settings";
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-foreground/5 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/5 transition-colors border-t-2 border-black"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
