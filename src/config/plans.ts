export const STAGES = [
  "Contacted",
  "Replied",
  "Call Booked",
  "Proposal Sent",
  "Negotiating",
  "Won",
  "Lost",
] as const;

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
  QUALITY: "/quality",
} as const;

export const PAGE_SIZE = 50 as const;
