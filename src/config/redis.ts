import Redis from 'ioredis';
import envs from './envs';

const redis = new Redis(envs.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

export default redis;
