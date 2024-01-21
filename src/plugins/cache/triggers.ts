// interface CacheTrigger {

//   // query name for triggering cache set
//   // if query is not on schema, it will not trigger cache get and set
//   query: String;

//   // mutation name for triggering cache delete
//   // if a mutation is not on schema, it will not trigger cache invalidation
//   mutation: String[];

//   // namespace to be used for caching
//   // this namespace is also deleted when mutation is triggered
//   namespaceUsed: string;
  
//   // In seconds
//   ttl?: number;

//   // fetch from args
//   // used for single-result query such as link
//   // if uniqueIdentifier is not found args, it will not caching
//   uniqueIdentifier?: String;
// }

// interface MutationTrigger {

//   // mutation name for triggering cache delete
//   // if a mutation is not on schema, it will not trigger cache invalidation
//   mutation: String[];

//   // namespace(s) to be deleted when mutation is triggered
//   // uniqueIdentifier is fetched from args
//   // used for single-result query such as link
//   // if uniqueIdentifier is not found args, it will not invalidate caching
//   affectedNamespace: { [key: string]: {uniqueIdentifier?: String };}
// }

interface queryTrigger {
  
    // In miliseconds
    ttl?: number;
  
    // fetch from args
    // used for single-result query such as link
    // if uniqueIdentifier is not found args, it will not caching
    uniqueIdentifier?: String;

    mutation?: String[];
}

// export const cacheTriggers : CacheTrigger[] = [
//   {
//     query: "feed",
//     mutation: ["post","vote","delete","update"],
//     namespaceUsed: "feed",
//     ttl: 600
//   },
//   {
//     query: "link",
//     mutation: ["post","vote","delete","update"],
//     namespaceUsed: "link",
//     ttl: 600,
//     uniqueIdentifier: "id"
//   }
// ]

export const triggers : {[key: string]: queryTrigger} = {
  "feed": {
    ttl: 60 * 10 * 1000, // 10 minute
    mutation: ["post","vote","delete","update"]
  },
  "link": {
    ttl: 60 * 10 * 1000, // 10 minute
    uniqueIdentifier: "id",
    mutation: ["vote","delete","update"]
  }
}

// Invalidate cache by mutation
// if there is identical mutation name in different array, it will trigger the first only
// export const mutationTriggers : MutationTrigger[] = [
//   {
//     mutation: ["post"],
//     affectedNamespace: {
//       "feed": {}
//     }
//   },
//   {
//     mutation: ["vote","delete","update"],
//     affectedNamespace: {
//       "feed": {},
//       "link": {
//         uniqueIdentifier: "id"
//       },
//     }
//   }
// ]