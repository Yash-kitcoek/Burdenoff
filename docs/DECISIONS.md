# Implementation decisions

## Schema-first GraphQL

The `.graphql` SDL keeps the API contract readable independently from the
TypeScript resolver implementation.

## Validation at the boundary

Titles and content are trimmed and rejected when empty. Slugs use lowercase
letters/numbers separated by single hyphens. Expected client failures are
returned as actionable GraphQL errors before persistence.

## Cursor pagination

Documents order by `createdAt` then `id`. Fetching one extra record determines
whether another page exists, avoiding offset pagination's cost and drift.

## Consistent missing-resource behavior

Mutations check referenced collections/documents first, so clients receive a
consistent `NOT_FOUND` error rather than database-specific implementation
details.

## Deliberate omissions

Authentication, RBAC, caching, federation, and deployment are excluded by the
assignment and have not been added speculatively.
