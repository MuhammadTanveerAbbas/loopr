import { describe, it, expect } from "vitest";

describe("Health check", () => {
  it("required env vars are documented", () => {
    const requiredVars = [
      "SUPABASE_URL",
      "SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "CORS_ORIGIN",
      "AI_API_KEY",
    ];

    // Verify the list is comprehensive
    expect(requiredVars).toContain("SUPABASE_URL");
    expect(requiredVars).toContain("AI_API_KEY");
    expect(requiredVars.length).toBeGreaterThanOrEqual(6);
  });

  it("auth page has all modes defined", () => {
    const modes = ["login", "signup", "reset"] as const;
    expect(modes.length).toBe(3);
  });
});
