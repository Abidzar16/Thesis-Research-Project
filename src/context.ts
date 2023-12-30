import { PrismaClient } from "@prisma/client";
import { IncomingMessage } from "http";
import { decodeAuthHeader, AuthTokenPayload } from "./utils/auth";
// import { Request } from "express";
// import { ApolloServer, BaseContext } from "@apollo/server";

export const prisma = new PrismaClient();

export interface Context {
    prisma: PrismaClient;
    userId?: number;
}

export const serverContext = async ({ req }: { req: IncomingMessage }) => {
    const token = req && req.headers.authorization
        ? decodeAuthHeader(req.headers.authorization)
        : null;

    return {
        prisma: new PrismaClient(),
        userId: token?.userId, 
    }

}