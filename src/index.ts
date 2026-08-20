import { createYoga } from "graphql-yoga";
import { db } from "./db";
import { schema } from "./schema";

const port = Number.parseInt(process.env.PORT ?? "4000", 10);
const yoga = createYoga({ schema, context: () => ({ db }), graphqlEndpoint: "/graphql" });

const server = Bun.serve({ port, fetch: yoga.fetch });
console.info(`Document Vault GraphQL API listening at http://localhost:${server.port}/graphql`);
