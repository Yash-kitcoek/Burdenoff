import { describe, expect, test } from "bun:test";
import { requireNonEmpty, requireSlug, requireTake } from "../../src/validation";

describe("input validation", () => {
  test("trims non-empty values", () => {
    expect(requireNonEmpty("  proposal  ", "title")).toBe("proposal");
  });

  test("rejects blank values with a GraphQL user error", () => {
    expect(() => requireNonEmpty(" \n", "content")).toThrow("content must not be empty");
  });

  test("accepts URL-safe slugs", () => {
    expect(requireSlug("team-documents-2026")).toBe("team-documents-2026");
  });

  test("rejects malformed slugs", () => {
    expect(() => requireSlug("Team Documents")).toThrow("slug must use lowercase");
  });

  test("limits pagination page size", () => {
    expect(requireTake(100)).toBe(100);
    expect(() => requireTake(101)).toThrow("between 1 and 100");
  });
});
