import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createSchema } from "graphql-yoga";
import { resolvers } from "./resolvers";

const schemaPath = fileURLToPath(new URL("./schema.graphql", import.meta.url));
const typeDefs = await readFile(schemaPath, "utf8");

export const schema = createSchema({ typeDefs, resolvers });
