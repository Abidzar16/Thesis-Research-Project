interface queryTrigger {
  
  // In miliseconds
  ttl?: number;

  // fetch from args
  // used for single-result query such as link
  // if uniqueIdentifier is not found args, it will not caching
  uniqueIdentifier?: String;

  mutation?: String[];
}

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