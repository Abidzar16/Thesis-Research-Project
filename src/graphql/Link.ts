import { Prisma } from "@prisma/client";
import { arg, enumType, extendType, inputObjectType, intArg, list, nonNull, objectType, stringArg } from "nexus";
import { GraphQLError } from 'graphql';

export const LinkOrderByInput = inputObjectType({
  name: "LinkOrderByInput",
  definition(t) {
    t.field("description", { type: Sort });
    t.field("url", { type: Sort });
    t.field("createdAt", { type: Sort });
  },
});

export const Sort = enumType({
  name: "Sort",
  members: ["asc", "desc"],
});

export const Link = objectType({
  name: "Link",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("description");
    t.nonNull.string("url");
    t.nonNull.field("createdAt", { type: 'DateTime' })
    t.field("postedBy", {   // 1
    type: "User",
    resolve: (parent, _args, context) => {  // 2
      return context.prisma.link
      .findUnique({ where: { id: parent.id } })
      ?.postedBy(); // Fix: Use optional chaining to handle undefined context.prisma.link
    },
  });
    t.nonNull.list.nonNull.field("voters", {  // 1
    type: "User",
    resolve(parent, args, context) : any {
      return context.prisma.link
      .findUnique({ where: { id: parent.id } })
      .voters();
    }
    });
    t.nonNull.field("updatedAt", { type: 'DateTime' });
    t.nonNull.boolean("isDeleted");
  },
});

export const Feed = objectType({
  name: "Feed",
  definition(t) {
    t.nonNull.list.nonNull.field("links", { type: Link });
    t.nonNull.int("count");
    t.id("id");
  },
});

export const LinkQuery = extendType({
  type: "Query",
  definition(t) { // fetch single Link by query
  t.nonNull.field("link", {
    type: "Link",
    args: {
    id: nonNull(intArg()),
    },
    async resolve(_parent, args, context) : Promise<any> {
      try {
        const result : any = await context.prisma.link.findUnique({
          where: { id: args.id as number },
        });
        if (result.isDeleted){
          throw new GraphQLError("The links has been deleted.", {
            extensions: {
              code: 'LINK_DELETED',
            },
          });
        } else {
          return result
        }
      } catch (error) {
        throw error;
      }
    },
  });
  },
});

export const FeedQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.field("feed", {
    type: "Feed",
    args: {
      filter: stringArg(),
      skip: intArg(),
      take: intArg(),
      orderBy: arg({ type: list(nonNull(LinkOrderByInput)) }),
    },
    async resolve(parent, args, context) {
      const where = args.filter
        ? {
        OR: [
          { description: { contains: args.filter } },
          { url: { contains: args.filter } },
        ],
        }
      : {};
      
      const links = await context.prisma.link.findMany({
        where,
        skip: args?.skip as number | undefined,
        take: args?.take as number | undefined,
        orderBy: args?.orderBy as
        | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
        | undefined,
      });
      
      const count = await context.prisma.link.count({ where });  // 2
      const id = `main-feed:${JSON.stringify(args)}`;  // 3
      
      return {  // 4
        links,
        count,
        id,
      };
    },
    });
  },
});

export const PostMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("post", {
    type: "Link",
    args: {
      description: nonNull(stringArg()),
      url: nonNull(stringArg()),
    },
    resolve(parent, args, context) {
      const { description, url } = args;
      const { userId } = context;
      
      if (!userId) {  // 1
        throw new GraphQLError("Cannot post without logging in.", {
          extensions: {
            code: 'UNAUTHENTICATED'
          },
        });
      }
      
      const newLink = context.prisma.link.create({
      data: {
        description,
        url,
        postedBy: { connect: { id: userId } },  // 2
      },
      });
      
      return newLink;
    },
    });
  },
});

export const DeleteMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("delete", {
    type: "GeneralMessage",
    args: {
      id: nonNull(intArg()),
    },
    async resolve(parent, args, context) : Promise<any> {
      const { userId } = context;
      const { id } = args;
      
          if (!userId) {  // 1
            throw new GraphQLError("Cannot delete without logging in.", {
              extensions: {
                code: 'UNAUTHENTICATED'
              },
            });
          }
      
      try {
      const content = await context.prisma.link.findUnique({
        where: {
        id: id,
        postedById: userId, // Ensure the user owns the content
        },
      });
    
      if (!content) {
        throw new GraphQLError(`Content not found or you don't have permission to delete it.`, {
          extensions: {
            code: 'NOT_FOUND'
          },
        });
      }
    
      // If content exists and belongs to the user, proceed with deletion
      const updatedLink = await context.prisma.link.update({
        where: {
          id: id,
          postedById: userId,
        },
        data: {
          isDeleted: !content.isDeleted,
        },
      });

      return {"message": `Content with id ${id} is now ${updatedLink.isDeleted ? 'deleted' : 'restored'}`}
    
      } catch (error) {
      throw new GraphQLError('Failed to delete content.', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR'
          },
        }); // Re-throw for error handling in your application
      }
    },
    });
  },
});

export const UpdateMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("update", {
    type: "Link",
    args: {
      id: nonNull(intArg()),
      description: stringArg(),
      url: stringArg(),
    },
    async resolve(parent, args, context) : Promise<any> {
      const { userId } = context;
      const { id, description, url } = args;
      
      if (!userId) {  // 1
      throw new GraphQLError("Cannot update without logging in.", {
        extensions: {
          code: 'UNAUTHENTICATED'
        },
      });
      }

      if (!description && !url) {  // 1
        throw new GraphQLError("Cannot update without empty description and url.", {
          extensions: {
            code: 'BAD_REQUEST'
          },
        });
      }
      
      try {
      const content = await context.prisma.link.findUnique({
        where: {
        id: id,
        postedById: userId, // Ensure the user owns the content
        },
        select: { description: true, url: true },
      });
    
      if (!content) {
        throw new GraphQLError(`Content not found or you don't have permission to update it.`, {
          extensions: {
            code: 'NOT_FOUND'
          },
        });
      }
    
      // If content exists and belongs to the user, proceed with deletion
      const updatedLink = await context.prisma.link.update({
        where: {
        id: id,
        postedById: userId,
        },
        data: {
        description: description || content.description,
        url: url || content.url,
        updatedAt: new Date(),
        },
      });

      return updatedLink
    
      } catch (error) {
      throw new GraphQLError('Failed to update content.', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        },
      }); // Re-throw for error handling in your application
      }
    },
    });
  },
});