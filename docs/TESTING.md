# Testing strategy

## Unit tests

`test/unit/validation.test.ts` covers input normalization and validation
errors. `test/unit/resolvers.test.ts` uses a typed Prisma mock to cover cursor
pagination and search conditions without requiring a database.

```sh
bun run test:unit
```

## Integration test

The integration test creates a real Yoga server with Prisma. It creates a
unique collection, creates and searches for a document through GraphQL, and
removes test records afterwards.

```sh
docker compose up -d
bun run gendb
bun run test:integration
```

## Quality gate

`bun run sanity` runs linting, strict TypeScript checking, and tests. The PR
workflow runs linting, type checking, and database-independent unit tests.
