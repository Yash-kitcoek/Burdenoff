# Architecture

## Overview

Document Vault is a single-process GraphQL service. GraphQL handles transport,
resolvers hold application logic, and Prisma is the persistence boundary to PostgreSQL.

```text
GraphQL client -> Yoga server -> schema and resolvers -> validation -> Prisma -> PostgreSQL
```

## Request lifecycle

1. Yoga validates a request against the schema-first GraphQL SDL.
2. A resolver receives arguments and a context containing Prisma.
3. The resolver normalizes and validates business input before writing data.
4. Expected failures become GraphQL errors with stable codes.
5. Prisma executes parameterized PostgreSQL queries and returns domain records.

## Module responsibilities

| Module | Responsibility |
| --- | --- |
| `src/index.ts` | Bun HTTP server and GraphQL endpoint. |
| `src/schema.ts` | Loads the SDL and combines it with resolvers. |
| `src/schema.graphql` | Public API contract. |
| `src/resolvers.ts` | Query and mutation orchestration. |
| `src/validation.ts` | Domain validation and user-facing GraphQL errors. |
| `src/db.ts` | Prisma client. |
| `prisma/schema.prisma` | Database model and indexes. |

## Data model and scaling path

A collection owns documents; each document belongs to one collection. The
relation restricts collection deletion so documents cannot disappear silently.
Indexes support filtering by collection, archive state, and chronological order.

For a larger API, add DataLoader batching for nested collection lists and
PostgreSQL full-text search for ranked queries. Authentication would enter at
the GraphQL context boundary rather than being spread through resolvers.
