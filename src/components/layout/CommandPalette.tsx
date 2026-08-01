import { useEffect, useState, useCallback, useMemo, useSyncExternalStore } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLeads } from "@/lib/leads-api";
import { commandPaletteStore } from "@/lib/command-palette-store";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Table2,
  Kanban,
  Heart,
  CheckCircle2,
  Brain,
  Trash2,
  Settings,
} from "lucide-react";

const pages = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Table2 },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/nurture", label: "Nurture", icon: Heart },
  { to: "/closed", label: "Closed Won", icon: CheckCircle2 },
  { to: "/ai", label: "AI Workspace", icon: Brain },
  { to: "/trash", label: "Trash", icon: Trash2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function CommandPalette() {
  const [search, setSearch] = useState("");
  const open = useSyncExternalStore(commandPaletteStore.subscribe, commandPaletteStore.getSnapshot);
  const setOpen = useCallback((v: boolean) => commandPaletteStore.setOpen(v), []);
  const nav = useNavigate();
  const { data } = useLeads();
  const leads = useMemo(() => data?.leads ?? [], [data]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen, open]);

  const run = useCallback(
    (to: string) => {
      setOpen(false);
      setSearch("");
      nav({ to });
    },
    [nav, setOpen],
  );

  const filteredLeads = leads
    .filter(
      (l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        (l.company ?? "").toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 5);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search pages or leads..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages
            .filter((p) => p.label.toLowerCase().includes(search.toLowerCase()))
            .map((p) => (
              <CommandItem key={p.to} onSelect={() => run(p.to)}>
                <p.icon className="h-4 w-4 mr-2" />
                {p.label}
              </CommandItem>
            ))}
        </CommandGroup>
        {filteredLeads.length > 0 && (
          <CommandGroup heading="Leads">
            {filteredLeads.map((l) => (
              <CommandItem key={l.id} onSelect={() => run("/leads")}>
                <span className="font-medium">{l.name}</span>
                {l.company && <span className="text-muted-foreground ml-1">· {l.company}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
