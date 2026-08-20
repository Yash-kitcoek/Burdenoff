import { Prisma, type Collection, type Document, type PrismaClient } from "@prisma/client";
import { badInput, notFound, requireNonEmpty, requireSlug, requireTake } from "./validation";

export interface Context {
  db: PrismaClient;
}

interface CreateCollectionInput {
  name: string;
  slug: string;
}

interface CreateDocumentInput {
  title: string;
  content: string;
  tags: string[];
  collectionId: string;
  isArchived?: boolean | null;
}

interface UpdateDocumentInput {
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  isArchived?: boolean | null;
}

type CollectionWithDocuments = Collection & { documents?: Document[] };

async function existingCollection(db: PrismaClient, id: string): Promise<void> {
  const collection = await db.collection.findUnique({ where: { id }, select: { id: true } });
  if (collection === null) throw notFound("Collection");
}

async function existingDocument(db: PrismaClient, id: string): Promise<void> {
  const document = await db.document.findUnique({ where: { id }, select: { id: true } });
  if (document === null) throw notFound("Document");
}

export const resolvers = {
  Query: {
    collections: (_parent: unknown, _args: Record<string, never>, { db }: Context) =>
      db.collection.findMany({ orderBy: { createdAt: "desc" } }),

    collection: async (_parent: unknown, { id }: { id: string }, { db }: Context) =>
      db.collection.findUnique({ where: { id }, include: { documents: { orderBy: { createdAt: "desc" } } } }),

    documents: async (
      _parent: unknown,
      args: { collectionId?: string | null; search?: string | null; isArchived?: boolean | null; take?: number | null; cursor?: string | null },
      { db }: Context,
    ) => {
      const take = requireTake(args.take ?? 20);
      const where: Prisma.DocumentWhereInput = {
        ...(args.collectionId === undefined || args.collectionId === null ? {} : { collectionId: args.collectionId }),
        ...(args.isArchived === undefined || args.isArchived === null ? {} : { isArchived: args.isArchived }),
      };
      const search = args.search?.trim();
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ];
      }

      const rows = await db.document.findMany({
        where,
        take: take + 1,
        ...(args.cursor ? { cursor: { id: args.cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });
      const hasNextPage = rows.length > take;
      const nodes = hasNextPage ? rows.slice(0, take) : rows;
      return { nodes, nextCursor: hasNextPage ? nodes.at(-1)?.id ?? null : null };
    },
  },

  Collection: {
    documents: (parent: CollectionWithDocuments, _args: Record<string, never>, { db }: Context) =>
      parent.documents ?? db.document.findMany({ where: { collectionId: parent.id }, orderBy: { createdAt: "desc" } }),
  },

  Mutation: {
    createCollection: async (_parent: unknown, { input }: { input: CreateCollectionInput }, { db }: Context) => {
      try {
        return await db.collection.create({
          data: { name: requireNonEmpty(input.name, "name"), slug: requireSlug(input.slug) },
        });
      } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw badInput("slug must be unique");
        }
        throw error;
      }
    },

    createDocument: async (_parent: unknown, { input }: { input: CreateDocumentInput }, { db }: Context) => {
      await existingCollection(db, input.collectionId);
      return db.document.create({
        data: {
          title: requireNonEmpty(input.title, "title"),
          content: requireNonEmpty(input.content, "content"),
          tags: input.tags,
          collectionId: input.collectionId,
          isArchived: input.isArchived ?? false,
        },
      });
    },

    updateDocument: async (_parent: unknown, { id, input }: { id: string; input: UpdateDocumentInput }, { db }: Context) => {
      await existingDocument(db, id);
      if (Object.keys(input).length === 0) throw badInput("at least one field must be provided");
      return db.document.update({
        where: { id },
        data: {
          ...(input.title === undefined || input.title === null ? {} : { title: requireNonEmpty(input.title, "title") }),
          ...(input.content === undefined || input.content === null ? {} : { content: requireNonEmpty(input.content, "content") }),
          ...(input.tags === undefined || input.tags === null ? {} : { tags: input.tags }),
          ...(input.isArchived === undefined || input.isArchived === null ? {} : { isArchived: input.isArchived }),
        },
      });
    },

    deleteDocument: async (_parent: unknown, { id }: { id: string }, { db }: Context) => {
      await existingDocument(db, id);
      return db.document.delete({ where: { id } });
    },

    moveDocument: async (_parent: unknown, { id, collectionId }: { id: string; collectionId: string }, { db }: Context) => {
      await Promise.all([existingDocument(db, id), existingCollection(db, collectionId)]);
      return db.document.update({ where: { id }, data: { collectionId } });
    },
  },
};
