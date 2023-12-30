import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { PrismaClient } from "@prisma/client";
import { schema } from "./schema";
import { serverContext, Context } from "./context";

const port = 3000;
export const prisma = new PrismaClient();

export const server = new ApolloServer<Context>({
    schema,
    introspection: true,
    plugins: [ApolloServerPluginLandingPageLocalDefault()],
});

const { url } = await startStandaloneServer(server, {
    context: serverContext,
    listen: { port: port },
});

console.log(`🚀  Server ready at ${url}`);