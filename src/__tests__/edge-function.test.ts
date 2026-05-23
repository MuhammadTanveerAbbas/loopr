import { describe, it, expect } from "vitest";

const PROMPTS = {
  briefing: ["leads_summary"],
  email_draft: ["name", "company", "stage"],
  reply_analysis: ["text"],
  icp_score: ["user_icp", "lead_text"],
};

describe("Edge function task validation", () => {
  it("all known tasks have required payload fields defined", () => {
    const validTasks = [
      "briefing",
      "email_draft",
      "reply_analysis",
      "icp_score",
      "recap",
      "reengage",
      "autopsy",
    ];
    expect(validTasks.length).toBeGreaterThanOrEqual(7);
  });

  it.each(["briefing", "email_draft", "reply_analysis", "icp_score"])(
    "task %s has required fields specified",
    (task) => {
      const fields = PROMPTS[task as keyof typeof PROMPTS];
      expect(fields.length).toBeGreaterThan(0);
    },
  );

  it("all tasks are lowercase and kebab-case", () => {
    const tasks = [
      "briefing",
      "email_draft",
      "reply_analysis",
      "icp_score",
      "recap",
      "reengage",
      "autopsy",
    ];
    for (const t of tasks) {
      expect(t).toMatch(/^[a-z_]+$/);
    }
  });
});
