import { GraphQLDateTime } from "graphql-scalars"; // 1
import { asNexusMethod } from "nexus";

export const GQLDate = asNexusMethod(GraphQLDateTime, "DateTime");  // 2