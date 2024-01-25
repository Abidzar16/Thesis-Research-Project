import { createClient } from 'redis';
import * as dotenv from "dotenv";
import { DocumentNode } from 'graphql';
import { visit } from 'graphql';

dotenv.config();

const Redis_URI = process.env.REDIS_URI || ""

// const client = new Redis(Redis_URI);
const client = await createClient({url: Redis_URI})
                  .on('error', err => console.log('Redis Client Error', err))
                  .connect();

export async function setCacheWithNamespaceAndExpire(
  key: string,
  value: any,
  namespace: string,
  expireMiliseconds?: number,
  id?: any
): Promise<void> {
  const fullKey = id ? `${namespace}:${id}:${key}` : `${namespace}:${key}`;
  if (!expireMiliseconds) {
    await client.set(fullKey, JSON.stringify(value));
    return;
  } else {
    await client.set(fullKey, JSON.stringify(value), {
      PX: expireMiliseconds
    });
  }
  return;
}

export async function getCacheWithNamespace(
  key: string,
  namespace: string,
  id?: any
): Promise<any> {
  const fullKey = id ? `${namespace}:${id}:${key}` : `${namespace}:${key}`;
  const value = await client.get(fullKey);
  return value ? JSON.parse(value) : null;
}

export async function deleteCacheByNamespace(
  namespace: string,
  id?: any
): Promise<void> {

  // Invalidate all cache with the namespace
  const key = id ? `${namespace}:${id}:*` : `${namespace}:*`;
  const keys = await client.scanIterator({ MATCH: key });
  for await (const key of keys) {
    client.del(key);
  }
  
  return;
}

// extract processed arguments in form of dictionary from combining
// GraphQL request document and variabes
// if any of arguments' value is variable, replace it with the value from variabes
export function fetchArguments(
  document: DocumentNode,
  variables: { [key: string]: any }
): { [key: string]: any } {
  
  const args: { [key: string]: any } = {};
  visit(document, {
    Argument(node) {
      const name = node.name.value;

      if (node.value.kind === 'Variable'){
        args[name] = variables[node.value.name.value];
      } else if (node.value.kind === 'NullValue') {
        args[name] = null;
      } else if (node.value.kind === 'ListValue') {
        args[name] = node.value.values;
      } else if (node.value.kind === 'ObjectValue') {
        args[name] = node.value.fields;
      } else if (node.value.kind === 'IntValue') {
        args[name] = parseInt(node.value.value);
      } else if (node.value.kind === 'FloatValue') {
        args[name] = parseFloat(node.value.value);
      } else {
        args[name] = node.value.value;
      }
    },
  });
  return args;
}