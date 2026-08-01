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
