interface Trigger {
  query: String;
  mutation: String[];
  namespaceUsed: string;
  namespaceRelevant?: string[];
  ttl?: number; // In seconds
}

export const triggers : Trigger[] = [
  {
    query: "feed",
    mutation: ["post","vote"],
    namespaceUsed: "feed",
    ttl: 600
  }
]