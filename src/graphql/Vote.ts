import { User } from "@prisma/client";
import { extendType, intArg, nonNull, objectType } from "nexus";

export const Vote = objectType({
    name: "Vote",
    definition(t) {
        t.nonNull.field("link", { type: "Link" });
        t.nonNull.field("user", { type: "User" });
    },
});

export const VoteMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.field("vote", {
            type: "Vote",
            args: {
                linkId: nonNull(intArg()),
            },
            async resolve(parent, args, context) {
                const { userId } = context;
                const { linkId } = args;

                if (!userId) {  // 1
                    throw new Error("Cannot vote without logging in.");
                }

                const alreadyVote = await context.prisma.link.findUnique({
                    where: {
                        id: linkId,
                        voters: {
                        some: {
                            id: userId
                        }}
                    }
                });

                let link : any;

                if (!alreadyVote) {
                    link = await context.prisma.link.update({  // 2
                        where: {
                            id: linkId
                        },
                        data: {
                            voters: {
                                connect: {
                                    id: userId
                                }
                            }
                        }
                    })
                } else {
                    link = await context.prisma.link.update({
                        where: {
                            id: linkId
                        },
                        data: {
                            voters: {
                                disconnect: {
                                    id: userId
                                }
                            }
                        }
                    })
                }

                const user = await context.prisma.user.findUnique({ where: { id: userId } });

                return {  // 3
                    link,
                    user: user as User
                };
            },
        })
    }
})