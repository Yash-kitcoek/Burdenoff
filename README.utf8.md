# Document Vault — GraphQL API

A small Bun, TypeScript, GraphQL Yoga, PostgreSQL, and Prisma backend for
organizing documents into collections.

## Setup

Prerequisites: Bun and Docker Desktop.

```sh
docker compose up -d && bun install && bun run gendb && bun run dev
```

The API and GraphiQL explorer are at `http://localhost:4000/graphql`.
`gendb` generates Prisma Client and applies Prisma migrations. Create future
schema changes only with `bun run migrate:dev -- --name <name>`.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the API with watching |
| `bun run test:unit` | Run resolver and validation tests |
| `bun run test:integration` | Run the Docker PostgreSQL integration test |
| `bun run sanity` | Run linting, type checking, and tests |

The integration test requires the Docker database and applied migrations.

## API

The schema lives in `src/schema.graphql`. `documents` filters by optional
`collectionId`, `search`, and `isArchived`, and accepts `take` and `cursor`.
Search is a case-insensitive PostgreSQL substring match over title and content.
The response returns `nodes` and `nextCursor`; pass the cursor into the next
request. Page size is 1–100.

The mutations are `createCollection`, `createDocument`, `updateDocument`,
`deleteDocument`, and `moveDocument`. Blank titles/contents, malformed slugs,
and invalid page sizes return GraphQL `BAD_USER_INPUT`; missing resources return
`NOT_FOUND`.

## Design choices

- Slugs are explicit: callers own their public identifiers and get immediate
  validation feedback.
- Documents order by `createdAt` then `id`; the id is used as the Prisma cursor.
- Nested collection documents are preloaded for a single collection and fetched
  only when necessary. A larger API would add DataLoader batching.
- Deliberately omitted: auth, RBAC, caching, federation, and deployment.

## Suggested walkthrough

Create a collection and a document in GraphiQL; query its nested documents;
move or archive it; show a filtered document query and `nextCursor`; then run
`bun run sanity`.
