# Document Vault walkthrough

This is a concise written walkthrough suitable for the submission.

1. The schema is deliberately schema-first: `src/schema.graphql` defines all
   public types, queries, mutations, inputs, and pagination response shape.
2. `prisma/schema.prisma` holds the relational model. A collection has many
   documents; document tags are stored as PostgreSQL text arrays. The model has
   indexes for the principal collection, archive-state, and chronological
   access paths.
3. Resolvers are kept in `src/resolvers.ts`, separate from server setup. They
   validate domain input before persistence and turn predictable failures into
   GraphQL errors with `BAD_USER_INPUT` or `NOT_FOUND` codes.
4. Document search uses PostgreSQL's case-insensitive `contains` condition on
   both title and content. Cursor pagination requests one extra row and returns
   the final retained document id as `nextCursor` when another page exists.
5. Unit tests cover validation and resolver pagination/filter behavior using a
   typed mocked Prisma client. The integration test drives GraphQL Yoga against
   the real Prisma/PostgreSQL database and cleans up its temporary records.
6. `bun run sanity` is the one-command quality gate. A Dockerfile and pull
   request GitHub Actions workflow are included as optional assignment bonuses.

Tradeoff: I retained an explicit cursor id instead of encoding an opaque,
versioned cursor payload because the document primary key is unique and Prisma
supports it natively. At a larger scale I would add DataLoader batching for
collection lists and Postgres full-text search for richer ranking.
