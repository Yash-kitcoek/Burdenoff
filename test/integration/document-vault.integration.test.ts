import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createYoga } from "graphql-yoga";
import { db } from "../../src/db";
import { schema } from "../../src/schema";

const yoga = createYoga({ schema, context: () => ({ db }), graphqlEndpoint: "/graphql" });
let collectionId = "";

async function execute(query: string, variables?: Record<string, unknown>) {
  const response = await yoga.fetch("http://localhost/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return response.json() as Promise<{ data?: Record<string, unknown>; errors?: { message: string }[] }>;
}

describe("Document Vault API (PostgreSQL)", () => {
  beforeAll(async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const result = await execute(
      "mutation($input: CreateCollectionInput!) { createCollection(input: $input) { id } }",
      { input: { name: "Integration collection", slug: `integration-${suffix}` } },
    );
    collectionId = (result.data?.createCollection as { id: string }).id;
  });

  afterAll(async () => {
    if (collectionId) {
      await db.document.deleteMany({ where: { collectionId } });
      await db.collection.delete({ where: { id: collectionId } });
    }
    await db.$disconnect();
  });

  test("creates and searches a document", async () => {
    const create = await execute(
      "mutation($input: CreateDocumentInput!) { createDocument(input: $input) { id title } }",
      { input: { title: "Release notes", content: "The vault is ready", tags: ["release"], collectionId } },
    );
    expect(create.errors).toBeUndefined();

    const search = await execute(
      "query($search: String!) { documents(search: $search) { nodes { title } nextCursor } }",
      { search: "vault" },
    );
    expect(search.errors).toBeUndefined();
    expect(search.data?.documents).toEqual(expect.objectContaining({ nodes: expect.arrayContaining([expect.objectContaining({ title: "Release notes" })]) }));
  });
});
