import { objectType, extendType, nonNull, stringArg } from "nexus";
import bcrypt from 'bcryptjs'
import pkg from 'jsonwebtoken';
// import { APP_SECRET } from "../utils/auth";
import * as dotenv from "dotenv";

dotenv.config();

const { sign } = pkg;
const APP_SECRET : any = process.env.APP_SECRET

export const AuthPayload = objectType({
    name: "AuthPayload",
    definition(t) {
        t.nonNull.string("token");
        t.nonNull.field("user", {
            type: "User",
        });
    },
});

export const AuthMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("signup", {
            type: "AuthPayload",
            args: {
                email: nonNull(stringArg()),
                password: nonNull(stringArg()),
                name: nonNull(stringArg()),
            },
            async resolve(parent, args, context): Promise<any> {
                const { email, name } = args;

                const existingUser = await context.prisma.user.findUnique({
                    where: { email },
                });

                if (existingUser) {
                    throw new Error("User with this email already exists");
                }

                const password = await bcrypt.hash(args.password, 10);

                const user = await context.prisma.user.create({
                    data: { email, name, password },
                });

                const token = sign({ userId: user.id }, APP_SECRET);

                return {
                    token,
                    user,
                };
            },
        });

        t.nonNull.field("login", {
            type: "AuthPayload",
            args: {
                email: nonNull(stringArg()),
                password: nonNull(stringArg()),
            },
            async resolve(parent, args, context) {
                const user = await context.prisma.user.findUnique({
                    where: { email: args.email },
                });
                if (!user) {
                    throw new Error("No such user found");
                }

                const valid = await bcrypt.compare(
                    args.password,
                    user.password,
                );
                if (!valid) {
                    throw new Error("Invalid password");
                }

                const token = sign({ userId: user.id }, APP_SECRET);

                return {
                    token,
                    user,
                };
            },
        });
    },
});