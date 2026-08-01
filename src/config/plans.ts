export const STAGES = [
  "New",
  "Contacted",
  "Replied",
  "Call Booked",
  "Proposal Sent",
  "Negotiating",
  "Won",
  "Lost",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_COLOR: Record<string, "blue" | "amber" | "green" | "purple" | "red" | "muted"> =
  {
    New: "muted",
    Contacted: "muted",
    Replied: "blue",
    "Call Booked": "amber",
    "Proposal Sent": "purple",
    Negotiating: "amber",
    Won: "green",
    Lost: "red",
  };

export const ROUTES = {
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  LEADS: "/leads",
  PIPELINE: "/pipeline",
  NURTURE: "/nurture",
  CLOSED: "/closed",
  IMPORT: "/import",
  AI: "/ai",
  TRASH: "/trash",
  ACTIVITY: "/activity",
  SETTINGS: "/settings",
} as const;

export const PAGE_SIZE = 50 as const;
