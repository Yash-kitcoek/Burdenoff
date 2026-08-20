# API guide

The local endpoint is `http://localhost:4000/graphql`. GraphiQL is served at
the same URL for exploration.

## Create data

```graphql
mutation CreateCollection {
  createCollection(input: { name: "Product", slug: "product" }) { id name slug }
}
```

```graphql
mutation CreateDocument($collectionId: ID!) {
  createDocument(input: {
    title: "Q3 roadmap"
    content: "Prioritise the document search experience."
    tags: ["planning", "q3"]
    collectionId: $collectionId
  }) { id title tags }
}
```

## Query and paginate

```graphql
query SearchDocuments($cursor: String) {
  documents(search: "roadmap", isArchived: false, take: 20, cursor: $cursor) {
    nodes { id title content tags collectionId }
    nextCursor
  }
}
```

Pass `nextCursor` to the next request as `cursor`. `null` means there is no
next page. `take` must be between 1 and 100.

## Nested documents and updates

```graphql
query CollectionWithDocuments($id: ID!) {
  collection(id: $id) { id name documents { id title isArchived } }
}
```

Mutations are `createCollection`, `createDocument`, `updateDocument`,
`deleteDocument`, and `moveDocument`.

| Code | Meaning |
| --- | --- |
| `BAD_USER_INPUT` | Blank title/content, malformed slug, or invalid page size. |
| `NOT_FOUND` | A referenced document or collection does not exist. |
