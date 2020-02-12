import crypto from 'crypto';
import IORedis, { RedisOptions, Redis } from 'ioredis';

const db: { [key: string]: Redis } = {};

export const jsonMd5 = (obj: object): string =>
  crypto
    .createHash('md5')
    .update(JSON.stringify(obj))
    .digest('hex');

function createClient(key: string, options: Array<RedisOptions>): void {
  db[key] = new IORedis(...options);
}

export default function(...options: Array<RedisOptions>): Redis {
  const key = jsonMd5(options);
  if (!db[key]) {
    createClient(key, options);
  }
  return db[key];
}

export { RedisOptions, Redis };
