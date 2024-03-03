import * as dotenv from "dotenv";
import { createClient } from 'redis';

dotenv.config();

const Redis_URI = process.env.REDIS_URI || ""

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
