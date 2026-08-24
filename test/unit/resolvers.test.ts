import { describe, expect, test } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import { resolvers } from "../../src/resolvers";

const document = (id: string) => ({
  id,
  title: `Title ${id}`,
  content: "content",
  tags: [],
  collectionId: "collection-1",
  isArchived: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
});

describe("document resolvers", () => {
  test("returns a cursor only when another page exists", async () => {
    const fakeDb = {
      document: { findMany: async () => [document("three"), document("two"), document("one")] },
    } as unknown as PrismaClient;

    const result = await resolvers.Query.documents({}, { take: 2 }, { db: fakeDb });
    expect(result.nodes.map((item) => item.id)).toEqual(["three", "two"]);
    expect(result.nextCursor).toBe("two");
  });

  test("uses case-insensitive title/content substring filters", async () => {
    let capturedWhere: unknown;
    const fakeDb = {
      document: {
        findMany: async (args: { where: unknown }) => {
          capturedWhere = args.where;
          return [];
        },
      },
    } as unknown as PrismaClient;

    await resolvers.Query.documents({}, { search: "Roadmap", isArchived: false }, { db: fakeDb });
    expect(capturedWhere).toEqual({
      isArchived: false,
      OR: [
        { title: { contains: "Roadmap", mode: "insensitive" } },
        { content: { contains: "Roadmap", mode: "insensitive" } },
      ],
    });
  });

  test("rejects an empty document title before touching the database", async () => {
    const fakeDb = {
      collection: { findUnique: async () => ({ id: "collection-1" }) },
      document: { create: async () => { throw new Error("should not be called"); } },
    } as unknown as PrismaClient;
    await expect(resolvers.Mutation.createDocument({}, {
      input: { title: " ", content: "valid", tags: [], collectionId: "collection-1" },
    }, { db: fakeDb })).rejects.toThrow("title must not be empty");
  });
});
