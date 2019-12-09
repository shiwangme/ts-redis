import crypto from 'crypto';
import debug from 'debug';
import { promisify } from 'util';
import redis, { RedisClient, ClientOpts } from 'redis';
import { list } from 'redis-commands';

export const jsonMd5 = (obj: object): string =>
  crypto
    .createHash('md5')
    .update(JSON.stringify(obj))
    .digest('hex');

interface CachedRedisClient {
  [key: string]: Function | RedisClient;
}

const db: {
  [key: string]: {
    [key: string]: CachedRedisClient | RedisClient | null;
  };
} = {};

function createClient(options: ClientOpts = {}): CachedRedisClient {
  const key = jsonMd5(options);
  const { db: selectedDB = 0 } = options;
  if (!db[key]) {
    db.key = {};
  }
  if (!db[key][selectedDB]) {
    const client = redis.createClient(options);
    client.select(selectedDB);
    client.on('error', (err: Error): void => {
      debug('swm:redis:client')(err);
      db[key][selectedDB] = null;
    });
    db[key][selectedDB] = client;
  }
  const result: CachedRedisClient = {};
  result.select = (sdb: number): CachedRedisClient =>
    createClient({ ...options, db: sdb });
  list.forEach((method: string) => {
    result[method] = (...args: []): Promise<any> => {
      if (db[key][selectedDB] === null) {
        // 异步,不然请求会阻塞
        ((): void => {
          createClient({ ...options, db: selectedDB });
        })();
        return new Promise(() => null);
      }
      const promiseFn = promisify(db[key][selectedDB][method]).bind(
        db[key][selectedDB]
      );
      return promiseFn(args);
    };
  });
  result.client = db[key][selectedDB];
  return result;
}

/**
 * 创建连接
 * @param  {obj} options Redis连接参数
 * @return {obj} Redis Client
 */
export default function createRedisClient(
  options: ClientOpts = {}
): CachedRedisClient {
  return createClient(options);
}
