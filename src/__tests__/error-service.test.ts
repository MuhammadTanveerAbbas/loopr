import { describe, it, expect } from "vitest";
import { sanitizeErrorMessage } from "@/lib/error-service";

describe("sanitizeErrorMessage", () => {
  it("maps known auth errors to friendly messages", () => {
    expect(sanitizeErrorMessage(new Error("Invalid login credentials"))).toBe(
      "Invalid email or password. Please try again.",
    );
  });

  it("returns short real error messages instead of the fallback", () => {
    expect(sanitizeErrorMessage(new Error("A lead with this email already exists."))).toBe(
      "A lead with this email already exists.",
    );
  });

  it("returns fallback for long or unknown messages", () => {
    const fallback = "Something went wrong. Please try again.";
    expect(sanitizeErrorMessage(new Error("x".repeat(200)), fallback)).toBe(fallback);
  });

  it("extracts message from plain error objects", () => {
    expect(
      sanitizeErrorMessage({ message: "duplicate key value violates unique constraint" }),
    ).toBe("duplicate key value violates unique constraint");
  });

  it("does not surface [object Object]", () => {
    expect(sanitizeErrorMessage({ code: "23505" })).toBe("Something went wrong. Please try again.");
  });
});

describe("Supabase connectivity error handling", () => {
  it("maps temporary network/timeout failures to a short, safe message", () => {
    const msg = sanitizeErrorMessage(new Error("fetch failed"), "Fallback");
    expect(msg.length).toBeGreaterThan(0);
    expect(msg.length).toBeLessThanOrEqual(140);
    expect(msg).not.toContain("service_role");
  });

  it("handles unavailable-service errors gracefully", () => {
    const msg = sanitizeErrorMessage(
      { message: "supabase connection refused: temporary failure" },
      "Fallback",
    );
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(0);
  });

  it("replaces long error dumps so secrets are not surfaced", () => {
    const secret = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret-token";
    const longDump = `request failed with auth ${secret} and a very long stack trace that exceeds the safe display limit for users`;
    const msg = sanitizeErrorMessage(new Error(longDump), "Fallback");
    expect(msg).toBe("Fallback");
    expect(msg).not.toContain(secret);
    expect(msg).not.toContain("eyJhbGci");
  });

  it("maps service-role errors to a friendly unavailable message", () => {
    expect(sanitizeErrorMessage(new Error("service_role key is not allowed"))).toBe(
      "Authentication service unavailable. Please try again later.",
    );
  });
});
