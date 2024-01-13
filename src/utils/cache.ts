// import { createClient } from 'redis';
import Redis from 'ioredis';
import * as dotenv from "dotenv";

dotenv.config();

// const client = await createClient({
//   url: process.env.REDIS_URI, // Replace with your Redis host
// })
//   .on('error', err => console.log('Redis Client Error', err))
//   .connect();

const Redis_URI = process.env.REDIS_URI || ""

const client = new Redis(Redis_URI);

export async function setCacheWithNamespaceAndExpire(
  key: string,
  value: any,
  namespace: string,
  expireSeconds?: number
): Promise<void> {
  const fullKey = `${namespace}:${key}`;
  if (!expireSeconds) {
    await client.set(fullKey, JSON.stringify(value));
    return;
  } else {
    await client.set(fullKey, JSON.stringify(value), "EX", expireSeconds);
  }
  return;
}

export async function getCacheWithNamespace(
  key: string,
  namespace: string
): Promise<any> {
  const fullKey = `${namespace}:${key}`;
  const value = await client.get(fullKey);
  return value ? JSON.parse(value) : null;
}

export async function deleteCacheByNamespace(
  namespace: string
): Promise<void> {

  // Invalidate all cache with the namespace
  var stream = client.scanStream({
    match: `${namespace}:*`
  });
  stream.on('data', function (keys: string[]) {
    // `keys` is an array of strings representing key names
    if (keys.length) {
      var pipeline = client.pipeline();
      keys.forEach(function (key: string) {
        pipeline.del(key);
      });
      pipeline.exec();
    }
  });
  stream.on('end', function () {
    console.log('done');
  });
  
  return;
}