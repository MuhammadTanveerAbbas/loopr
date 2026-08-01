import { createFileRoute, Link } from "@tanstack/react-router";
import { LoopMark } from "@/components/ui/logo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: "Changelog  Loopr" },
      { name: "description", content: "Latest updates and changes to Loopr." },
    ],
  }),
  component: ChangelogPage,
});

const entries = [
  {
    date: "July 2026",
    version: "v1.1.0",
    title: "Design & reliability overhaul",
    items: [
      "Redesigned sidebar: no scrollbar, permanent-fit sections, cleaner active states",
      "Navbar search now opens the Command Palette (⌘K)",
      "Consistent page headers, KPI cards, and empty states across all dashboard pages",
      "Responsive landing page and every dashboard page for mobile, tablet, and desktop",
      "Improved analytics: pipeline conversion funnel, responsive charts, compact revenue bars",
      "Fixed multi-line notes being flattened by sanitization",
      "Fixed real error messages being hidden behind generic fallbacks",
      "Fixed CSV import producing 'undefined undefined' names",
      "Dashboard stats now refresh immediately after lead updates",
      "Added 'New' stage for consistency across import, pipeline, and analytics",
      "Fixed signal-score day calculations in database functions",
    ],
  },
  {
    date: "May 2026",
    version: "v1.0.0",
    title: "Initial launch",
    items: [
      "Landing page with hero, features, pricing, and FAQ sections",
      "Dashboard with pipeline overview and KPI cards",
      "Pipeline by stage bar chart visualization",
      "Leads table with full CRUD operations",
      "Kanban pipeline view with drag-and-drop stage updates",
      "AI Workspace with lead briefing generation",
      "Nurture and closed deals views",
      "Authentication via email/password and Google OAuth",
      "Settings page with ICP configuration",
      "Quality & Security audit page",
    ],
  },
];

function ChangelogPage() {
  return (
    <main className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="flex items-center gap-3 mb-10">
          <LoopMark size={40} />
          <div className="leading-none">
            <div className="font-extrabold text-xl text-foreground">Loopr</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 mt-1">
              Changelog
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.version} className="brutal-card p-8 md:p-10">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
                    {entry.date}
                  </div>
                  <h2 className="text-2xl font-extrabold text-foreground mt-1">{entry.title}</h2>
                </div>
                <div className="brutal-badge whitespace-nowrap">{entry.version}</div>
              </div>
              <ul className="space-y-2">
                {entry.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm font-medium text-foreground/80"
                  >
                    <div className="w-2 h-2 rounded-full bg-brand-orange border border-black mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
