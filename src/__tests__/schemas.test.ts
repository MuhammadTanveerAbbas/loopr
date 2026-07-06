import { describe, it, expect } from "vitest";
import {
  createLeadSchema,
  updateLeadSchema,
  createTouchSchema,
  authSchema,
  sanitizeString,
} from "@/lib/schemas";

describe("createLeadSchema", () => {
  it("accepts valid lead", () => {
    const result = createLeadSchema.parse({ name: "Test Lead" });
    expect(result.name).toBe("Test Lead");
    expect(result.stage).toBe("Contacted");
  });

  it("rejects empty name", () => {
    expect(() => createLeadSchema.parse({ name: "" })).toThrow();
  });

  it("rejects name over 200 chars", () => {
    expect(() => createLeadSchema.parse({ name: "x".repeat(201) })).toThrow();
  });

  it("rejects negative deal_value", () => {
    expect(() => createLeadSchema.parse({ name: "Lead", deal_value: -1 })).toThrow();
  });

  it("accepts optional fields", () => {
    const result = createLeadSchema.parse({
      name: "Lead",
      company: "Acme",
      notes: "Some notes",
    });
    expect(result.company).toBe("Acme");
    expect(result.notes).toBe("Some notes");
  });
});

describe("updateLeadSchema", () => {
  it("accepts partial update", () => {
    const result = updateLeadSchema.parse({ name: "New Name" });
    expect(result.name).toBe("New Name");
  });

  it("accepts empty object", () => {
    const result = updateLeadSchema.parse({});
    expect(Object.keys(result).length).toBe(0);
  });

  it("rejects signal score over 100", () => {
    expect(() => updateLeadSchema.parse({ signal_score: 101 })).toThrow();
  });

  it("accepts tags array", () => {
    const result = updateLeadSchema.parse({ tags: ["Hot", "VIP"] });
    expect(result.tags).toEqual(["Hot", "VIP"]);
  });
});

describe("createTouchSchema", () => {
  it("accepts valid touch", () => {
    const result = createTouchSchema.parse({
      lead_id: "550e8400-e29b-41d4-a716-446655440000",
      type: "note",
    });
    expect(result.type).toBe("note");
  });

  it("rejects invalid type", () => {
    expect(() =>
      createTouchSchema.parse({
        lead_id: "550e8400-e29b-41d4-a716-446655440000",
        type: "invalid",
      }),
    ).toThrow();
  });

  it("rejects non-uuid lead_id", () => {
    expect(() => createTouchSchema.parse({ lead_id: "not-a-uuid", type: "note" })).toThrow();
  });
});

describe("authSchema", () => {
  it("accepts valid credentials", () => {
    const result = authSchema.parse({ email: "a@b.com", password: "123456" });
    expect(result.email).toBe("a@b.com");
  });

  it("rejects invalid email", () => {
    expect(() => authSchema.parse({ email: "not-email", password: "123456" })).toThrow();
  });

  it("rejects short password", () => {
    expect(() => authSchema.parse({ email: "a@b.com", password: "12345" })).toThrow();
  });
});

describe("sanitizeString", () => {
  it("removes angle brackets", () => {
    expect(sanitizeString("<script>alert(1)</script>")).toBe("scriptalert(1)/script");
  });

  it("removes control characters", () => {
    expect(sanitizeString("hello\x00world")).toBe("helloworld");
  });

  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });
});
